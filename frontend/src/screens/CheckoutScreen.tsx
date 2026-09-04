import React, { useState } from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';

import { cancelReservation, confirmDemoPayment } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import ProfileAvatar from '../components/ProfileAvatar';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token: contextToken } = useAuth();

  const {
    reservationId,
    ticketCount = 1,
    selectedSeats = [],
    total = 0,
    movieTitle = 'Entrada',
    authToken,
    purchaseType = 'tickets',
    foodItems = [],
    foodTotal = 0,
    cinemaComplex = '',
  } = route.params ?? {};

  const token = authToken ?? contextToken;
  const isFoodPurchase = purchaseType === 'food';
  const paymentTotal = isFoodPurchase ? Number(foodTotal) : Number(total);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCard = () => {
    if (
      cardName.trim().length < 2 ||
      cardNumber.replace(/\s/g, '').length < 16 ||
      expiry.trim().length < 4 ||
      cvv.trim().length < 3
    ) {
      Alert.alert('Completa los datos', 'Ingresa correctamente los datos de la tarjeta.');
      return false;
    }

    return true;
  };

  const payFood = async () => {
    if (processing) return;
    setError(null);

    if (!validateCard()) return;

    setProcessing(true);

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 900));

      Alert.alert(
        '¡Pago exitoso! 🎉',
        `Tu pedido de comida fue confirmado.\n\nComplejo: ${cinemaComplex}\nTotal: $${paymentTotal.toFixed(2)}\n\nPuedes retirar tu pedido en el área de confitería.`,
        [{
          text: 'Aceptar',
          onPress: () => navigation.replace('Cine'),
        }],
      );
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : 'No se pudo completar el pago.';
      setError(message);
      Alert.alert('No se pudo completar el pago', message);
    } finally {
      setProcessing(false);
    }
  };

  const payTickets = async () => {
    if (processing) return;
    setError(null);

    if (!reservationId) {
      Alert.alert('Error', 'No encontramos la reserva de esta compra.');
      return;
    }

    if (!token) {
      Alert.alert('Sesión no disponible', 'No pudimos validar tu sesión. Regresa e intenta nuevamente.');
      return;
    }

    if (!validateCard()) return;

    setProcessing(true);

    try {
      const response = await confirmDemoPayment(token, reservationId);

      if (!response?.reservation) {
        throw new Error('El servidor no devolvió la reserva pagada.');
      }

      const tickets = response.reservation.tickets ?? [];
      if (tickets.length === 0) {
        throw new Error('El pago fue procesado, pero no se generó ningún ticket.');
      }

      const ticket = tickets[0];
      const qrPayload = `ticketsafe:v1:${ticket.id}:${ticket.qrCodeHash}`;

      navigation.replace('Ticket', {
        ticketId: ticket.id,
        qrPayload,
        status: 'VALID',
        movieTitle: response.reservation.showtime?.movie?.title ?? movieTitle,
        selectedSeats: selectedSeats.length > 0 ? selectedSeats : [ticket.seatNumber],
        startTime: response.reservation.showtime?.startTime,
        roomName: response.reservation.showtime?.room?.name,
        reservationId,
      });
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : 'No se pudo completar el pago.';
      setError(message);
      Alert.alert('No se pudo completar el pago', message);
    } finally {
      setProcessing(false);
    }
  };

  const pay = async () => {
    if (isFoodPurchase) {
      await payFood();
      return;
    }

    await payTickets();
  };

  const cancelCurrentReservation = async () => {
    if (isFoodPurchase) {
      if (!processing) navigation.goBack();
      return;
    }

    if (!reservationId || !token || processing) {
      navigation.goBack();
      return;
    }

    try {
      await cancelReservation(token, reservationId);
      navigation.goBack();
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la reserva.';
      Alert.alert('No se pudo cancelar', message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => void cancelCurrentReservation()} style={styles.backButton} disabled={processing}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View style={styles.headerTitle}>
            <Text style={styles.overline}>Compra segura</Text>
            <Text style={styles.title}>Pago</Text>
          </View>

          <ProfileAvatar />
        </View>

        <View style={styles.secureBanner}>
          <Text style={styles.secureIcon}>🔒</Text>
          <View style={styles.secureContent}>
            <Text style={styles.secureTitle}>Pago protegido</Text>
            <Text style={styles.secureText}>
              {isFoodPurchase
                ? 'Completa el pago de tu pedido de comida de forma segura.'
                : 'Tu reserva se mantiene activa mientras completas el pago.'}
            </Text>
          </View>
        </View>

        {isFoodPurchase ? (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Resumen de comida</Text>
            <Text style={styles.movieTitle}>🍿 Pedido de confitería</Text>

            {foodItems.map((item: any) => (
              <View key={item.id} style={styles.foodRow}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodQuantity}>Cantidad: {item.quantity}</Text>
                </View>
                <Text style={styles.foodPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Complejo</Text>
              <Text style={styles.infoValue}>{cinemaComplex || '—'}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>${paymentTotal.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Resumen de compra</Text>
            <Text style={styles.movieTitle}>{movieTitle}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entradas</Text>
              <Text style={styles.infoValue}>{ticketCount}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Butacas</Text>
              <Text style={styles.infoValue}>{selectedSeats.length ? selectedSeats.join(', ') : '—'}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>${paymentTotal.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Tarjeta</Text>
          <Text style={styles.demoText}>Modo demostración: puedes usar los datos precargados.</Text>

          <Text style={styles.inputLabel}>Nombre del titular</Text>
          <TextInput
            value={cardName}
            onChangeText={setCardName}
            placeholder="Ana García"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Número de tarjeta</Text>
          <TextInput
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="4242 4242 4242 4242"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={19}
          />

          <View style={styles.cardFields}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>Vencimiento</Text>
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="12/28"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <AppButton
          label={isFoodPurchase ? `Pagar comida · $${paymentTotal.toFixed(2)}` : `Pagar ahora · $${paymentTotal.toFixed(2)}`}
          onPress={() => void pay()}
          loading={processing}
          disabled={processing}
        />

        <Pressable style={styles.cancelButton} onPress={() => void cancelCurrentReservation()} disabled={processing}>
          <Text style={styles.cancelText}>{isFoodPurchase ? 'Volver a Cine' : 'Cancelar compra'}</Text>
        </Pressable>

        <Text style={styles.footerText}>
          {isFoodPurchase
            ? 'Al confirmar el pago recibirás la confirmación de tu pedido.'
            : 'Al confirmar el pago recibirás tu ticket digital con código QR.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 35,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  overline: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.display,
  },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 14,
  },
  secureIcon: {
    fontSize: 25,
    marginRight: 12,
  },
  secureContent: {
    flex: 1,
  },
  secureTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  secureText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  movieTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  foodQuantity: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  foodPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 6,
    paddingTop: 14,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  demoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  cardFields: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: colors.critical + '18',
    borderWidth: 1,
    borderColor: colors.critical + '50',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    color: colors.critical,
    fontSize: 12,
    lineHeight: 18,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
});
