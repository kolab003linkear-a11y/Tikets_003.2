import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getMyTickets, TicketDetails } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import ProfileAvatar from '../components/ProfileAvatar';
import AppScreenHeader from '../components/AppScreenHeader';

export default function MyTicketsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'TODOS' | 'VALID' | 'USED' | 'EXPIRED'>('TODOS');

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMyTickets(token);
      setTickets(response.tickets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus tickets.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadTickets();
  }, [loadTickets]));

  const filteredTickets = useMemo(
    () => filter === 'TODOS' ? tickets : tickets.filter((ticket) => ticket.status === filter),
    [filter, tickets],
  );

  const stadiumTicket = (ticket: TicketDetails) => ticket.qrPayload.startsWith('stadiumsafe:');
  const busTicket = (ticket: TicketDetails) => ticket.qrPayload.startsWith('bussafe:');
  const parkingTicket = (ticket: TicketDetails) => ticket.qrPayload.startsWith('parkingsafe:');
  const parkingSpotLabel = (ticket: TicketDetails) => {
    const spaceNumber = Number(ticket.seatNumber);
    const floor = Math.floor((spaceNumber - 1) / 8) + 1;
    const index = (spaceNumber - 1) % 8;
    const code = `${String.fromCharCode(65 + Math.floor(index / 4))}${(index % 4) + 1}`;
    return `Plaza ${code} - Piso ${floor}`;
  };
  const displayTitle = (ticket: TicketDetails) => parkingTicket(ticket) ? ticket.event.title.replace(/\s*\((?:demo|demostración)\)/gi, '') : ticket.event.title;
  const statusLabel = (status: TicketDetails['status']) => status === 'VALID' ? 'Activo' : status === 'USED' ? 'Usado' : 'Expirado';

  const openMapsAt = (latitude: number, longitude: number) => {
    const base = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const uri = Platform.OS === 'ios'
      ? `comgooglemaps://?q=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(uri).catch(() => Linking.openURL(base));
  };

  const shareLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('No disponible', 'Tu navegador no soporta geolocalización.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
          },
          () => {
            Alert.alert('No se pudo obtener la ubicación', 'Verifica que hayas dado permiso en tu navegador.');
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
        return;
      }

      Alert.alert(
        'Compartir ubicación en tiempo real',
        'Para que te sigan en vivo durante el viaje, abriremos Google Maps.\n\n1. En Maps, toca el botón azul de tu ubicación actual.\n2. Toca "Compartir ubicación" (o el ícono de ubicación).\n3. Elige por cuánto tiempo (ej. 1 hora) y a quién enviársela.\n\nTu ubicación se actualizará en tiempo real hasta por 24 horas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Google Maps', onPress: () => void openMaps() },
        ],
      );
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    }
  };

  const openMaps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa el acceso a la ubicación desde la configuración de tu dispositivo para compartirla con Google Maps.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      openMapsAt(location.coords.latitude, location.coords.longitude);
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    }
  };

  const ticketIcon = (ticket: TicketDetails) => {
    if (busTicket(ticket)) return 'bus-outline';
    if (stadiumTicket(ticket)) return 'football-outline';
    if (parkingTicket(ticket)) return 'car-outline';
    return 'film-outline';
  };

  const ticketTypeLabel = (ticket: TicketDetails) => {
    if (busTicket(ticket)) return 'BUS';
    if (stadiumTicket(ticket)) return 'ESTADIO';
    if (parkingTicket(ticket)) return 'PARQUEADERO';
    return 'EVENTO';
  };

  const openTicket = (ticket: TicketDetails) => {
    navigation.navigate('Ticket', {
      ticketId: ticket.id,
      qrPayload: ticket.qrPayload,
      status: ticket.status,
      movieTitle: displayTitle(ticket),
      selectedSeats: [parkingTicket(ticket) ? parkingSpotLabel(ticket) : ticket.seatNumber],
      startTime: ticket.event.startTime,
      roomName: ticket.event.room,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.container}
        data={filteredTickets}
        keyExtractor={(ticket) => ticket.id}
        onRefresh={() => void loadTickets()}
        refreshing={loading}
        ListHeaderComponent={<>
          <AppScreenHeader
            eyebrow="Tu cuenta"
            title="Mis Tickets"
            subtitle="Todo lo que necesitas para entrar, en un solo lugar."
            right={<><View style={styles.headerIcon}><Ionicons name="ticket" size={21} color={colors.text} /></View><ProfileAvatar /></>}
          />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{tickets.filter((ticket) => ticket.status === 'VALID').length}</Text><Text style={styles.summaryLabel}>Activos</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{tickets.length}</Text><Text style={styles.summaryLabel}>Total</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{tickets.filter(stadiumTicket).length}</Text><Text style={styles.summaryLabel}>Estadios</Text></View>
          </View>
          <View style={styles.filters}>
            {(['TODOS', 'VALID', 'USED', 'EXPIRED'] as const).map((item) => (
              <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} style={[styles.filter, filter === item && styles.filterSelected]} onPress={() => setFilter(item)}>
                <Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>{item === 'TODOS' ? 'Todos' : statusLabel(item)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.listTitle}>{filter === 'TODOS' ? 'Tus próximas experiencias' : `${statusLabel(filter)}s`}</Text>
        </>}
        ListEmptyComponent={!loading ? <View style={styles.state}><Ionicons name={error ? 'cloud-offline-outline' : 'ticket-outline'} size={34} color={colors.textSecondary} /><Text style={styles.stateTitle}>{error ? 'No pudimos cargar tus entradas' : filter === 'TODOS' ? 'Todavía no tienes tickets' : 'No hay tickets en este estado'}</Text><Text style={styles.stateText}>{error ?? 'Tus entradas confirmadas aparecerán aquí.'}</Text>{error && <Pressable style={styles.retry} onPress={() => void loadTickets()}><Text style={styles.retryText}>Reintentar</Text></Pressable>}</View> : <View style={styles.state}><ActivityIndicator color={colors.primary} /></View>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ticket de ${item.event.title}, localidad ${item.seatNumber}`} style={[styles.card, item.status === 'VALID' && styles.activeCard, item.status === 'USED' && styles.usedCard]} onPress={() => openTicket(item)}>
            <View style={styles.cardTopline}>
              <View style={styles.typeRow}><Ionicons name={ticketIcon(item)} size={15} color={colors.primary} /><Text style={styles.typeText}>{ticketTypeLabel(item)}</Text></View>
              <View style={[styles.statusBadge, item.status !== 'VALID' && styles.statusBadgeMuted]}><Text style={[styles.status, item.status !== 'VALID' && styles.statusMuted]}>{statusLabel(item.status)}</Text></View>
            </View>
            <Text style={styles.movieTitle}>{displayTitle(item)}</Text>
            {item.status === 'VALID' && <View style={styles.readyLine}><Ionicons name="checkmark-circle" size={14} color={colors.success} /><Text style={styles.readyText}>Entrada lista para usar</Text></View>}
            <View style={styles.detailsBlock}>
              <View style={styles.detailRow}><Ionicons name="calendar-outline" size={16} color={colors.textSecondary} /><Text style={styles.meta}>{new Date(item.event.startTime).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View>
              <View style={styles.detailRow}><Ionicons name="location-outline" size={16} color={colors.textSecondary} /><Text style={styles.meta} numberOfLines={1}>{item.event.room}</Text></View>
              <View style={styles.detailRow}><Ionicons name="grid-outline" size={16} color={colors.textSecondary} /><Text style={styles.meta}>{parkingTicket(item) ? parkingSpotLabel(item) : `Localidad ${item.seatNumber}`}</Text></View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.ticketId}>ID {item.id.slice(-8).toUpperCase()}</Text>
              <View style={styles.footerActions}>
                {busTicket(item) && item.status === 'VALID' && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Compartir ubicación en tiempo real" style={styles.shareAction} onPress={(e) => { e.stopPropagation?.(); void shareLocation(); }}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} />
                    <Text style={styles.share}>Ubicación en vivo</Text>
                  </Pressable>
                )}
                <View style={styles.qrAction}><Ionicons name="qr-code-outline" size={18} color={colors.primary} /><Text style={styles.open}>Abrir QR</Text><Ionicons name="arrow-forward" size={14} color={colors.primary} /></View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  summaryRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, marginBottom: 18 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  filter: { backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: colors.text },
  listTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 11 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  activeCard: { borderColor: colors.success + '70' },
  usedCard: { opacity: 0.82 },
  cardTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statusBadge: { backgroundColor: colors.success + '20', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusBadgeMuted: { backgroundColor: colors.textSecondary + '18' },
  movieTitle: { color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  readyLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  readyText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  status: { color: colors.success, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statusMuted: { color: colors.textSecondary },
  detailsBlock: { gap: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  meta: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shareAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  share: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  ticketId: { color: colors.textSecondary, fontSize: 10, letterSpacing: 0.5 },
  qrAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  open: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  state: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retry: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
  retryText: { color: colors.text, fontWeight: '800' },
});
