import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography } from '../theme';
import ProfileAvatar from '../components/ProfileAvatar';

const screenWidth = Dimensions.get('window').width;

type TicketEntry = {
  ticketId: string;
  qrPayload?: string;
  status?: string;
  seatNumber?: string;
};

export default function TicketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    tickets: ticketsParam,
    ticketId,
    qrPayload,
    status = 'VALID',
    movieTitle,
    selectedSeats,
    startTime,
    roomName,
  } = route.params ?? {};

  // Compra de un solo asiento (flujo original) vs. varios asientos a la vez
  // (uno o más partidos de fútbol): si `tickets` no viene en los params, se
  // arma un arreglo de un solo elemento con los datos "planos" de siempre,
  // así esta pantalla sigue funcionando igual para MyTicketsScreen y
  // CheckoutScreen sin tener que tocarlas.
  const tickets: TicketEntry[] =
    Array.isArray(ticketsParam) && ticketsParam.length > 0
      ? ticketsParam
      : [
          {
            ticketId,
            qrPayload,
            status,
            // Compatibilidad con CheckoutScreen (cine): ahí varios asientos
            // pueden pertenecer a un mismo ticket/reserva, así que se listan
            // todos juntos igual que antes.
            seatNumber: Array.isArray(selectedSeats) ? selectedSeats.join(', ') : selectedSeats,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const useNativeDriver = Platform.OS !== 'web';
  const scale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver }),
          Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver }),
        ]),
      ),
    ]).start();
  }, [glow, scale]);

  const formattedDate = startTime
    ? new Date(startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Horario pendiente';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" style={styles.homeButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.homeText}>Inicio</Text>
        </Pressable>
        <View style={styles.profileButton}><ProfileAvatar /></View>

        {tickets.length > 1 && (
          <Text style={styles.counter}>
            Entrada {activeIndex + 1} de {tickets.length} · desliza para ver las demás
          </Text>
        )}

        <ScrollView
          horizontal
          pagingEnabled={tickets.length > 1}
          scrollEnabled={tickets.length > 1}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollArea}
          contentContainerStyle={tickets.length === 1 ? styles.singlePageWrap : undefined}
        >
          {tickets.map((ticket, index) => (
            <View key={ticket.ticketId ?? index} style={[styles.page, { width: screenWidth }]}>
              <Animated.View style={[styles.ticketCard, { transform: [{ scale }], shadowOpacity: glow }]}>
                <Animated.View style={[styles.glow, { opacity: glow }]} />
                <Text style={styles.badge}>Entrada digital</Text>
                <Text style={styles.title}>{movieTitle}</Text>
                <Text style={styles.subtitle}>
                  {ticket.seatNumber && ticket.seatNumber.includes(',') ? 'Butacas' : 'Butaca'}: {ticket.seatNumber ?? '—'}
                </Text>
                <Text style={styles.accessStatus}>ACCESO AUTORIZADO · {ticket.status ?? status}</Text>
                <View style={styles.qrBox} accessibilityLabel="Código QR de la entrada">
                  <QRCode value={ticket.qrPayload ?? ticket.ticketId} size={156} color={colors.background} backgroundColor={colors.text} />
                </View>
                <Text style={styles.eventInfo}>{formattedDate}</Text>
                <Text style={styles.eventInfo}>{roomName ?? 'Sala pendiente'}</Text>
                <Text style={styles.info}>Ticket ID: {ticket.ticketId}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {tickets.length > 1 && (
          <View style={styles.dots}>
            {tickets.map((ticket, index) => (
              <View key={ticket.ticketId ?? index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20, backgroundColor: colors.background },
  homeButton: { position: 'absolute', top: 50, left: 20, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, zIndex: 1 },
  homeText: { color: colors.text, fontWeight: '700' },
  profileButton: { position: 'absolute', top: 48, right: 20, zIndex: 1 },
  counter: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  // Sin un ancho explícito aquí, el ScrollView se encoge al tamaño de su
  // contenido dentro de `container` (que centra con alignItems: 'center'),
  // y el gesto de deslizar deja de tener área donde funcionar. Con
  // width: '100%' toma todo el ancho de pantalla y el paginado sí desliza.
  scrollArea: { width: '100%' },
  singlePageWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  ticketCard: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.success, shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, elevation: 12 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: colors.success, opacity: 0.1 },
  badge: { color: colors.success, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 10, fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginBottom: 18 },
  qrBox: { backgroundColor: colors.text, alignSelf: 'center', width: 180, height: 180, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  accessStatus: { color: colors.success, fontSize: 12, fontWeight: '800', marginBottom: 12 },
  eventInfo: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 5 },
  info: { color: colors.text, fontSize: 14, marginBottom: 8 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.success, width: 18 },
});
