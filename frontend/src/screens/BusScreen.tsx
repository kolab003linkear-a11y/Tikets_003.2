import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { BusRoute, BusTrip, createBusTicket, getBuses } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import AppState from '../components/AppState';
import { PaymentModal } from '../components/parking/PaymentModal';

const CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta'];
const TERMINAL_LABELS: Record<string, string> = {
  QUITUMBE: 'Terminal Quitumbé',
  CALDERON: 'Terminal Calderón',
  CARCELEN: 'Terminal Carcelén',
  GYE: 'Terminal Guayaquil',
  ABA: 'Terminal Ambato',
  MTA: 'Terminal Manta',
};
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];

const CITY_IMAGES: Record<string, string> = {
  Quito: 'https://images.unsplash.com/photo-1663480250469-fdc74af57b29?auto=format&fit=crop&q=80&w=960',
  Guayaquil: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Guayaquil_skyline.jpg/960px-Guayaquil_skyline.jpg',
  Cuenca: 'https://images.unsplash.com/photo-1504037307760-451759489ac9?auto=format&fit=crop&q=80&w=960',
  Ambato: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/CIUDAD_DE_AMBATO_-_panoramio.jpg/960px-CIUDAD_DE_AMBATO_-_panoramio.jpg',
  Manta: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/2022-10-04a_Wide_view_of_the_city_of_Manta%2C_Ecuador.jpg/960px-2022-10-04a_Wide_view_of_the_city_of_Manta%2C_Ecuador.jpg',
};

function cityImage(city: string) {
  return CITY_IMAGES[city] ?? `https://picsum.photos/seed/${city.toLowerCase()}/800/500`;
}

function formatDuration(departure: string, arrival: string | null) {
  if (!arrival) return 'Por confirmar';
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  const minutes = Math.max(Math.round((end - start) / 60000), 0);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h 00min` : `${h}h ${String(m).padStart(2, '0')}min`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

type Step = 'origin' | 'trips' | 'seats' | 'payment' | 'confirmation';

export default function BusScreen() {
  const { user, token, startGuestSession } = useAuth();
  const [step, setStep] = useState<Step>('origin');
  const [originCity, setOriginCity] = useState('Quito');
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<BusTrip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [error, setError] = useState('');
  const [ticketResult, setTicketResult] = useState<{ qrPayload: string; seat: number; trip: BusTrip } | null>(null);

  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [transferComprobante, setTransferComprobante] = useState('');

  const currentTrips = useMemo(() => routes.flatMap((route) => (route.trips ?? []).map((trip) => ({ ...trip, route }))), [routes]);

  const loadTrips = async () => {
    setLoading(true);
    setError('');
    try {
      setRoutes((await getBuses({ originCity })).routes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los buses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'trips' || step === 'seats' || step === 'payment') {
      void loadTrips();
    }
  }, [originCity, step]);

  const goToTrips = () => {
    setSelectedTrip(null);
    setSelectedSeats([]);
    setStep('trips');
  };

  const openTrip = (trip: BusTrip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setStep('seats');
  };

  const toggleSeat = (seat: number) => {
    setSelectedSeats((current) => (current.includes(seat) ? current.filter((s) => s !== seat) : [...current, seat]));
  };

  const goToPayment = () => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    setStep('payment');
  };

  const confirmPurchase = async () => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Datos incompletos', 'Necesitamos tu correo, nombre y teléfono para continuar.');
      return;
    }
    if (paymentMethod === 'tarjeta' && (!cardHolder.trim() || !cardNumber.trim())) {
      Alert.alert('Datos incompletos', 'Completa los datos de la tarjeta.');
      return;
    }
    if (paymentMethod === 'transferencia' && !transferComprobante.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el número de comprobante.');
      return;
    }

    setBuying(true);
    try {
      const session = user && token ? { user, token } : await startGuestSession(email.trim().toLowerCase(), fullName.trim(), phone.trim());
      const ticketsBySeat = await Promise.all(selectedSeats.map((seat) => createBusTicket(session.token, selectedTrip.id, seat)));
      const first = ticketsBySeat[0];
      setTicketResult({ qrPayload: first.ticket.qrPayload, seat: selectedTrip.id ? selectedSeats[0] : selectedSeats[0], trip: selectedTrip });
      setStep('confirmation');
    } catch (buyError) {
      Alert.alert('No se pudo generar el ticket', buyError instanceof Error ? buyError.message : 'Inténtalo nuevamente.');
    } finally {
      setBuying(false);
    }
  };

  const resetFlow = () => {
    setSelectedTrip(null);
    setSelectedSeats([]);
    setTicketResult(null);
    setStep('origin');
  };

  const totalPrice = (selectedTrip?.price ? Number(selectedTrip.price) : 0) * selectedSeats.length;

  const renderOrigin = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.kicker}>Movilidad</Text><Text style={styles.title}>¿Desde dónde viajas?</Text></View>
        <Ionicons name="bus-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.subtitle}>Elige tu ciudad de salida para ver los horarios disponibles.</Text>
      <View style={styles.cityGrid}>
        {CITIES.map((city) => (
          <Pressable key={city} onPress={() => { setOriginCity(city); goToTrips(); }} style={({ pressed }) => [styles.cityCard, pressed && styles.pressed]}>
            <Image source={{ uri: cityImage(city) }} style={styles.cityImage} />
            <Text style={styles.cityName}>{city}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderTrips = () => {
    const tripCards = currentTrips.map((trip) => {
      const route = trip.route!;
      const dest = route.destination;
      return (
        <Pressable key={trip.id} onPress={() => openTrip(trip)} style={({ pressed }) => [pressed && styles.pressed]}>
          <AppCard style={styles.listCard}>
            <Image source={{ uri: cityImage(dest) }} style={styles.tripImage} />
            <View style={styles.info}>
              <Text style={styles.name}>{dest}</Text>
              <Text style={styles.meta}>{route.originCity ?? route.origin} → {dest} · {route.operator}</Text>
              <Text style={styles.meta}>Terminal: {TERMINAL_LABELS[route.originTerminal] ?? route.originTerminal}</Text>
              <Text style={styles.meta}>{formatDate(trip.departureTime)} · {formatDuration(trip.departureTime, trip.arrivalTime)}</Text>
              <Text style={styles.meta}>{trip.availableSeats ?? 0}/{trip.totalSeats} asientos libres</Text>
            </View>
            <Text style={styles.price}>${Number(trip.price).toFixed(2)}</Text>
          </AppCard>
        </Pressable>
      );
    });

    return (
      <View style={styles.content}>
        <Pressable onPress={() => setStep('origin')} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Cambiar ciudad</Text>
        </Pressable>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>Salida desde {originCity}</Text><Text style={styles.title}>Viajes disponibles</Text></View>
          <Image source={{ uri: cityImage(originCity) }} style={styles.originAvatar} />
        </View>
        {loading ? <AppState loading title="Cargando viajes..." /> : error ? <><AppState title="No se pudieron cargar" message={error} /><AppButton label="Reintentar" onPress={() => void loadTrips()} /></> : tripCards.length ? tripCards : <AppState title="Sin viajes" message={`No hay viajes disponibles desde ${originCity} por ahora.`} />}
      </View>
    );
  };

  const renderSeats = () => {
    if (!selectedTrip) return null;
    const route = selectedTrip.route!;
    const occupied = selectedTrip.occupiedSeats ?? [];

    return (
      <View style={styles.content}>
        <Pressable onPress={() => setStep('trips')} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Volver a horarios</Text>
        </Pressable>
        <AppCard style={styles.card}>
          <Text style={styles.kicker}>Selecciona tus asientos</Text>
          <Text style={styles.title}>{route.originCity ?? route.origin} → {route.destination}</Text>
          <Text style={styles.meta}>{TERMINAL_LABELS[route.originTerminal] ?? route.originTerminal} · {route.operator}</Text>
          <Text style={styles.meta}>{formatDate(selectedTrip.departureTime)}</Text>
          <View style={styles.cabin}>
            <Ionicons name="bus-outline" size={16} color={colors.text} />
            <Text style={styles.cabinText}>CABINA DEL CONDUCTOR</Text>
          </View>
          <View style={styles.busBody}>
            {SEAT_ROWS.map((row) => (
              <View key={row} style={styles.seatRow}>
                <Text style={styles.rowLabel}>{row}</Text>
                {[1, 2].map((n) => renderSeat(`${row}${n}`, occupied))}
                <View style={styles.aisle} />
                {[3, 4].map((n) => renderSeat(`${row}${n}`, occupied))}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={[styles.legendDot, styles.legendSelected]} /><Text style={styles.legendText}>Seleccionado</Text>
            <View style={[styles.legendDot, styles.legendOccupied]} /><Text style={styles.legendText}>Ocupado</Text>
            <View style={[styles.legendDot, styles.legendFree]} /><Text style={styles.legendText}>Disponible</Text>
          </View>
          <Text style={styles.selectionText}>{selectedSeats.length === 0 ? 'Ningún asiento seleccionado' : `Selección: ${selectedSeats.join(', ')}`}</Text>
        </AppCard>
        <AppButton label={`Continuar (${selectedSeats.length} asientos) · $${(Number(selectedTrip.price) * selectedSeats.length).toFixed(2)}`} onPress={goToPayment} disabled={selectedSeats.length === 0} />
      </View>
    );
  };

  const renderSeat = (seatId: string, occupied: number[]) => {
    if (!selectedTrip) return null;
    const seatNumber = Number(seatId.replace(/[A-F]/, ''));
    const rowIndex = SEAT_ROWS.indexOf(seatId[0]);
    const seat = rowIndex * 4 + seatNumber;
    const isOccupied = occupied.includes(seat);
    const isSelected = selectedSeats.includes(seat);
    return (
      <Pressable
        key={seatId}
        disabled={isOccupied}
        onPress={() => toggleSeat(seat)}
        style={[styles.seat, isOccupied ? styles.seatOccupied : isSelected ? styles.seatSelected : styles.seatFree]}
      >
        <Text style={[styles.seatText, isOccupied && styles.seatTextOccupied]}>{seat}</Text>
      </Pressable>
    );
  };

  const renderPayment = () => {
    if (!selectedTrip) return null;
    const route = selectedTrip.route!;
    return (
      <View style={styles.content}>
        <Pressable onPress={() => setStep('seats')} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Volver a asientos</Text>
        </Pressable>
        <AppCard style={styles.card}>
          <Text style={styles.kicker}>Resumen de tu viaje</Text>
          <Text style={styles.title}>{route.originCity ?? route.origin} → {route.destination}</Text>
          <Text style={styles.meta}>{formatDate(selectedTrip.departureTime)} · {route.operator}</Text>
          <Text style={styles.meta}>Asientos ({selectedSeats.length}): {selectedSeats.join(', ')}</Text>
          <Text style={styles.priceLine}>Total: <Text style={styles.priceStrong}>${totalPrice.toFixed(2)}</Text></Text>
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.section}>Datos del pasajero</Text>
          <AppInput label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Ej. Nicole Slendy" />
          <AppInput label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <AppInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.section}>Método de pago</Text>
          <View style={styles.paymentRow}>
            {[{ id: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' }, { id: 'transferencia', label: 'Transfer.', icon: 'business-outline' }, { id: 'efectivo', label: 'Efectivo', icon: 'cash-outline' }].map((method) => (
              <Pressable key={method.id} onPress={() => setPaymentMethod(method.id)} style={[styles.paymentOption, paymentMethod === method.id && styles.paymentActive]}>
                <Ionicons name={method.icon as 'card-outline'} size={18} color={paymentMethod === method.id ? colors.text : colors.textSecondary} />
                <Text style={[styles.paymentText, paymentMethod === method.id && styles.paymentTextActive]}>{method.label}</Text>
              </Pressable>
            ))}
          </View>
          {paymentMethod === 'tarjeta' && (
            <View style={styles.paymentFields}>
              <AppInput label="Número de tarjeta" value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" placeholder="4532 ••••" />
              <AppInput label="Nombre del titular" value={cardHolder} onChangeText={setCardHolder} placeholder="Nombre del titular" />
            </View>
          )}
          {paymentMethod === 'transferencia' && (
            <View style={styles.paymentFields}>
              <Text style={styles.bankNote}>Banco Pichincha · Cta. Ahorros: 2201938492</Text>
              <AppInput label="Número de comprobante" value={transferComprobante} onChangeText={setTransferComprobante} placeholder="Número de comprobante" />
            </View>
          )}
          {paymentMethod === 'efectivo' && <Text style={styles.bankNote}>Pago en efectivo al momento del abordaje.</Text>}
        </AppCard>
        <AppButton label={`Confirmar pago ($${totalPrice.toFixed(2)})`} onPress={() => void confirmPurchase()} disabled={buying} loading={buying} />
      </View>
    );
  };

  const renderConfirmation = () => {
    if (!selectedTrip || !ticketResult) return null;
    const route = selectedTrip.route!;
    const qrValue = ticketResult.qrPayload;
    return (
      <View style={styles.content}>
        <View style={styles.confirmHeader}>
          <Text style={styles.title}>¡Viaje confirmado!</Text>
          <Text style={styles.subtitle}>Tu pasaje quedó registrado correctamente.</Text>
        </View>
        <AppCard style={styles.confirmCard}>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={176} color={colors.background} backgroundColor={colors.text} />
          </View>
          <Text style={styles.confirmRoute}>{route.originCity ?? route.origin} → {route.destination}</Text>
          <Text style={styles.meta}>{formatDate(selectedTrip.departureTime)} · {route.operator}</Text>
          <Text style={styles.meta}>Asientos: {selectedSeats.join(', ')}</Text>
          <Text style={styles.meta}>Terminal: {TERMINAL_LABELS[route.originTerminal] ?? route.originTerminal}</Text>
          <Text style={styles.priceStrong}>Total: ${totalPrice.toFixed(2)}</Text>
        </AppCard>
        <AppButton label="Volver al inicio de buses" onPress={resetFlow} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'origin' && renderOrigin()}
        {step === 'trips' && renderTrips()}
        {step === 'seats' && renderSeats()}
        {step === 'payment' && renderPayment()}
        {step === 'confirmation' && renderConfirmation()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 18, paddingBottom: 32 },
  content: { gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  card: { padding: 18, gap: 12 },
  listCard: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 12 },
  price: { color: colors.success, fontSize: 16, fontWeight: '800' },
priceLine: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  priceStrong: { color: colors.text, fontSize: 20, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: colors.primary, fontWeight: '700' },
  guest: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 7 },
  section: { color: colors.text, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cityCard: { width: '47%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityImage: { width: '100%', height: 96 },
  cityName: { color: colors.text, fontSize: 16, fontWeight: '800', padding: 12, textAlign: 'center' },
  originAvatar: { width: 44, height: 44, borderRadius: 12 },
  tripImage: { width: 72, height: 72, borderRadius: 12 },
  cabin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.input, paddingVertical: 12, borderRadius: 12 },
  cabinText: { color: colors.primary, fontSize: 11, letterSpacing: 1.2, fontWeight: '800' },
  busBody: { borderWidth: 2, borderColor: colors.borderStrong, borderRadius: 20, padding: 12, backgroundColor: colors.surface },
  seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  rowLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', width: 14 },
  aisle: { width: 18 },
  seat: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  seatFree: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
  seatSelected: { backgroundColor: colors.primary },
  seatOccupied: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
  seatText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  seatTextOccupied: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendSelected: { backgroundColor: colors.primary },
  legendOccupied: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
  legendFree: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
  legendText: { color: colors.textSecondary, fontSize: 10 },
  selectionText: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  paymentRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  paymentOption: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  paymentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  paymentText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  paymentTextActive: { color: colors.text },
  paymentFields: { gap: 6, marginTop: 4 },
  bankNote: { color: colors.textSecondary, fontSize: 12, backgroundColor: colors.input, padding: 12, borderRadius: 12, marginVertical: 4 },
  confirmHeader: { alignItems: 'center', gap: 8 },
  confirmCard: { alignItems: 'center', gap: 8, padding: 22 },
  qrWrap: { padding: 14, backgroundColor: colors.text, borderRadius: 20 },
  confirmRoute: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
});
