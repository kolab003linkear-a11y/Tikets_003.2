import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cancelReservation, createReservation } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';

const defaultRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const defaultColumns = 8;

export default function SeatSelectionScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, token, startGuestSession } = useAuth();
  const { showtimeId, movieTitle, price, seatLayout, occupiedSeats = [] } = route.params;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [reserving, setReserving] = useState(false);
  const reservingRef = useRef(false);
  const [pendingReservationId, setPendingReservationId] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');

  const layout = useMemo(() => {
    const rows = Array.isArray(seatLayout?.rows) && seatLayout.rows.length > 0 ? seatLayout.rows : defaultRows;
    const columns = typeof seatLayout?.columns === 'number' && seatLayout.columns > 0 ? seatLayout.columns : defaultColumns;
    return { rows, columns };
  }, [seatLayout]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      if (pendingReservationId && token) {
        void cancelReservation(token, pendingReservationId).catch(() => undefined);
        setPendingReservationId(null);
      }
      Alert.alert('Tiempo agotado', 'La reserva ha expirado. Vuelve a seleccionar función.', [
        { text: 'Volver', onPress: () => navigation.goBack() },
      ]);
    }
  }, [timeLeft, navigation, pendingReservationId, token]);

  useEffect(() => {
    return () => {
      if (pendingReservationId && token) {
        void cancelReservation(token, pendingReservationId).catch(() => undefined);
      }
    };
  }, [pendingReservationId, token]);

  const occupiedSet = useMemo(() => new Set(occupiedSeats), [occupiedSeats]);

  const toggleSeat = (seatCode: string) => {
    if (occupiedSet.has(seatCode) || reserving || timeLeft === 0) return;
    setSelectedSeats((current) => {
      if (current.includes(seatCode)) return current.filter((seat) => seat !== seatCode);
      return [...current, seatCode].sort((a, b) => a.localeCompare(b));
    });
  };

  const total = selectedSeats.length * price;

  const abandonPendingReservation = async (showConfirmation = false) => {
    if (!pendingReservationId || !token) {
      if (showConfirmation) {
        navigation.goBack();
      }
      return;
    }

    try {
      await cancelReservation(token, pendingReservationId);
      setPendingReservationId(null);
      if (showConfirmation) {
        Alert.alert('Reserva cancelada', 'La selección pendiente ha sido cancelada.');
      }
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la reserva pendiente.';
      Alert.alert('No se pudo cancelar la reserva', message);
      return;
    }

    if (showConfirmation) {
      navigation.goBack();
    }
  };

  const goToCheckout = async () => {
    if (reservingRef.current || selectedSeats.length === 0) {
      if (selectedSeats.length === 0) {
        Alert.alert('Selecciona al menos una butaca');
      }
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || fullName.trim().length < 2 || !/^[+\d\s()-]{7,30}$/.test(phone.trim())) {
      Alert.alert('Completa tus datos', 'Necesitamos tu nombre completo y teléfono para continuar con la compra.');
      return;
    }

    reservingRef.current = true;
    setReserving(true);
    try {
      setSavingProfile(true);
      const session = user && token ? { user, token } : await startGuestSession(email.trim().toLowerCase(), fullName.trim(), phone.trim());
      setSavingProfile(false);
      const response = await createReservation(session.token, session.user.id, showtimeId, selectedSeats);
      setPendingReservationId(response.reservation.id);
      navigation.navigate('Checkout', {
        reservationId: response.reservation.id,
        selectedSeats,
        ticketCount: selectedSeats.length,
        total,
        showtimeId,
        movieTitle,
      });
    } catch (reservationError) {
      const message = reservationError instanceof Error ? reservationError.message : 'No se pudo reservar esas butacas.';
      const conflictMatch = message.match(/Seats already reserved:\s*(.+)$/i);
      if (conflictMatch) {
        const conflictedSeats = conflictMatch[1].split(',').map((seat) => seat.trim());
        setSelectedSeats((current) => current.filter((seat) => !conflictedSeats.includes(seat)));
        Alert.alert('Butacas ocupadas', `Estas butacas ya no están disponibles: ${conflictedSeats.join(', ')}. Elige otras.`);
      } else {
        Alert.alert('No se pudo completar la reserva', message);
      }
    } finally {
      reservingRef.current = false;
      setReserving(false);
    }
  };

  const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const sec = String(timeLeft % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => { void abandonPendingReservation(true); }} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.subtitle}>Reserva activa</Text>
            <Text style={styles.title}>{movieTitle}</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>05:00</Text>
            <Text style={styles.timerValue}>{min}:{sec}</Text>
          </View>
        </View>

        <View style={styles.stagePanel}>
          <View style={styles.stage} />
          <View style={styles.grid}>
            {layout.rows.map((row: string) => (
              <View key={row} style={styles.row}>
                <Text style={styles.rowLabel}>{row}</Text>
                {Array.from({ length: layout.columns }, (_, index) => index + 1).map((column) => {
                  const seatCode = `${row}${column}`;
                  const isSelected = selectedSeats.includes(seatCode);
                  const isOccupied = occupiedSet.has(seatCode);
                  return (
                    <Pressable
                      key={seatCode}
                      onPress={() => toggleSeat(seatCode)}
                      accessibilityRole="button"
                      accessibilityLabel={`Butaca ${seatCode}`}
                      accessibilityState={{ disabled: isOccupied, selected: isSelected }}
                      style={[styles.seat, isSelected && styles.selectedSeat, isOccupied && styles.occupiedSeat]}
                    >
                      <Text style={styles.seatText}>{column}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, styles.availableDot]} /><Text style={styles.legendText}>Disponible</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, styles.occupiedDot]} /><Text style={styles.legendText}>Ocupada</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, styles.selectedDot]} /><Text style={styles.legendText}>Seleccionada</Text></View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Butacas</Text><Text style={styles.summaryValue}>{selectedSeats.length ? selectedSeats.join(', ') : 'Ninguna'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryValue}>${total.toFixed(2)}</Text></View>
          <AppButton
            label="Cancelar reserva"
            variant="secondary"
            onPress={() => { void abandonPendingReservation(true); }}
            disabled={!pendingReservationId || timeLeft === 0}
          />
          {(!user?.fullName || !user?.phone) && <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Datos para tu compra</Text>
            <Text style={styles.profileHint}>Solo te los pedimos una vez para emitir tu entrada.</Text>
            <AppInput label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="tu@correo.com" />
            <AppInput label="Nombre completo" autoCapitalize="words" value={fullName} onChangeText={setFullName} placeholder="Ej. Ana García" />
            <AppInput label="Teléfono" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="099 123 4567" />
          </View>}
          <AppButton label="Continuar al pago" onPress={() => void goToCheckout()} disabled={reserving || savingProfile || timeLeft === 0} loading={reserving || savingProfile} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: typography.display },
  timerBox: { backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 10 },
  timerLabel: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  timerValue: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stagePanel: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 18 },
  stage: { height: 24, backgroundColor: colors.primary, borderRadius: 999, width: '100%', marginBottom: 16, shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  grid: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rowLabel: { width: 18, color: colors.textSecondary, textAlign: 'center', fontWeight: '700' },
  seat: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  selectedSeat: { backgroundColor: colors.primary, borderColor: colors.primary },
  occupiedSeat: { backgroundColor: colors.critical, borderColor: colors.critical, opacity: 0.55 },
  seatText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 4 },
  availableDot: { backgroundColor: colors.surfaceRaised },
  occupiedDot: { backgroundColor: colors.critical },
  selectedDot: { backgroundColor: colors.primary },
  legendText: { color: colors.textSecondary, fontSize: 12 },
  summary: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  button: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
  buttonText: { color: colors.text, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  secondaryButton: { marginTop: 12, backgroundColor: colors.surfaceRaised, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
  secondaryButtonDisabled: { opacity: 0.5 },
  secondaryButtonText: { color: colors.text, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  profileCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, padding: 14, marginTop: 8 },
  profileTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  profileHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 },
});
