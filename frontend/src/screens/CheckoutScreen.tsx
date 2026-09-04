import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cancelReservation, confirmDemoPayment } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import ProfileAvatar from '../components/ProfileAvatar';
import AppButton from '../components/AppButton';
import { paymentMethods, PaymentMethod } from '../components/parking/PaymentModal';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useAuth();
  const { reservationId, ticketCount, selectedSeats, total, showtimeId, movieTitle, startTime, roomName, price } = route.params;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = startTime
    ? new Date(startTime).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Horario pendiente';

  const pay = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      const response = await confirmDemoPayment(token, reservationId, paymentMethod);
      const ticket = response.reservation.tickets[0];
      if (!ticket) throw new Error('El pago fue confirmado, pero no se recibió el ticket.');

      navigation.navigate('Ticket', {
        ticketId: ticket.id,
        qrPayload: `ticketsafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
        status: 'VALID',
        movieTitle,
        selectedSeats,
        startTime: response.reservation.showtime.startTime,
        roomName: response.reservation.showtime.room.name,
      });
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'No se pudo confirmar el pago.');
    } finally {
      setProcessing(false);
    }
  };

  const cancelCurrentReservation = async () => {
    if (!token) {
      navigation.goBack();
      return;
    }

    try {
      await cancelReservation(token, reservationId);
      Alert.alert('Reserva cancelada', 'La reserva pendiente ha sido cancelada.');
      navigation.goBack();
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la reserva.';
      Alert.alert('No se pudo cancelar la reserva', message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
          <ProfileAvatar />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}><View><Text style={styles.label}>Resumen de compra</Text><Text style={styles.summaryHint}>Verifica tus datos antes de pagar</Text></View><Ionicons name="ticket-outline" size={24} color={colors.primary} /></View>
          <Text style={styles.movieTitle}>{movieTitle}</Text>
          <View style={styles.infoRow}><Ionicons name="calendar-outline" size={17} color={colors.primary} /><Text style={styles.text}>{formattedDate}</Text></View>
          <View style={styles.infoRow}><Ionicons name="business-outline" size={17} color={colors.primary} /><Text style={styles.text}>{roomName ?? 'Sala pendiente'}</Text></View>
          <View style={styles.infoRow}><Ionicons name="grid-outline" size={17} color={colors.primary} /><Text style={styles.text}>{ticketCount} {ticketCount === 1 ? 'entrada' : 'entradas'} · {selectedSeats.join(', ')}</Text></View>
          <View style={styles.priceBreakdown}><Text style={styles.breakdownText}>${Number(price ?? total / ticketCount).toFixed(2)} x {ticketCount}</Text><Text style={styles.total}>${total.toFixed(2)}</Text></View>
          <Text style={styles.reservationId}>Reserva temporal: {reservationId}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.paymentHeader}><View><Text style={styles.label}>Pago seguro</Text><Text style={styles.summaryHint}>Tus datos se procesan de forma protegida</Text></View><Ionicons name="lock-closed-outline" size={20} color={colors.success} /></View>
          <Text style={styles.methodLabel}>MÉTODO DE PAGO</Text>
          <View style={styles.methods}>
            {paymentMethods.map((method) => (
              <Pressable key={method.key} accessibilityRole="button" accessibilityState={{ selected: paymentMethod === method.key }} onPress={() => setPaymentMethod(method.key)} style={[styles.method, paymentMethod === method.key && styles.methodSelected]}>
                <Ionicons name={method.icon} size={18} color={paymentMethod === method.key ? colors.primary : colors.textSecondary} />
                <Text style={[styles.methodText, paymentMethod === method.key && styles.methodTextSelected]}>{method.label}</Text>
              </Pressable>
            ))}
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <AppButton label="Cancelar reserva" variant="secondary" onPress={() => void cancelCurrentReservation()} disabled={processing} />
          <AppButton label="Pagar ahora" onPress={() => void pay()} disabled={processing} loading={processing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginLeft: 12, fontFamily: typography.display },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  paymentHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  summaryHint: { color: colors.textSecondary, fontSize: 12, marginTop: -3 },
  label: { color: colors.primary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  movieTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  text: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  priceBreakdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 5, paddingTop: 13 },
  breakdownText: { color: colors.textSecondary, fontSize: 13 },
  total: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
  reservationId: { color: colors.textSecondary, fontSize: 11, marginTop: 12 },
  formCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18 },
  methodLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  method: { width: '48%', minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  methodSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  methodText: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  methodTextSelected: { color: colors.text, fontWeight: '700' },
  payButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  payText: { textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 16 },
  secondaryButton: { backgroundColor: colors.surfaceRaised, borderRadius: 12, paddingVertical: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { textAlign: 'center', color: colors.text, fontWeight: '700', fontSize: 14 },
  error: { color: colors.critical, fontSize: 13, lineHeight: 19, marginBottom: 10 },
});
