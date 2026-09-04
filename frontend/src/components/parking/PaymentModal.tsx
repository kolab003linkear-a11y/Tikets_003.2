import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: '#0EA5E9',
  card: '#0F172A',
  muted: '#94A3B8',
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirmPayment: (method: PaymentMethod) => void;
  processing?: boolean;
  parkingOnly?: boolean;
  cancelLabel?: string;
}

export type PaymentMethod = 'CARD' | 'GOOGLE_PAY' | 'APPLE_PAY' | 'PAYPAL' | 'CASH';

export const paymentMethods: Array<{ key: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'CARD', label: 'Tarjeta •••• 4242', icon: 'card-outline' },
  { key: 'GOOGLE_PAY', label: 'Google Pay', icon: 'logo-google' },
  { key: 'APPLE_PAY', label: 'Apple Pay', icon: 'logo-apple' },
  { key: 'PAYPAL', label: 'PayPal', icon: 'logo-paypal' },
  { key: 'CASH', label: 'En tótem', icon: 'cash-outline' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
  processing = false,
  parkingOnly = false,
  cancelLabel = 'Cancelar reserva',
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>('CARD');
  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>PAGO SEGURO</Text>
              <Text style={styles.title}>Método de pago</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total a pagar:</Text>
            <Text style={styles.amount}>${totalAmount.toFixed(2)} USD</Text>
          </View>

          <Text style={styles.methodLabel}>METODO DE PAGO</Text>
          <View style={styles.methods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity disabled={processing} key={method.key} onPress={() => setSelectedMethod(method.key)} style={[styles.method, selectedMethod === method.key && styles.methodActive]}>
                <Ionicons name={method.icon} size={17} color={selectedMethod === method.key ? colors.primary : colors.muted} />
                <Text style={[styles.methodText, selectedMethod === method.key && styles.methodTextActive]}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!parkingOnly && (
            <TouchableOpacity disabled={processing} onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity disabled={processing} onPress={() => onConfirmPayment(selectedMethod)} style={[styles.payBtn, processing && styles.payBtnDisabled]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
            <Text style={styles.payText}>{processing ? 'Procesando pago...' : parkingOnly ? 'Pagar y habilitar salida' : 'Pagar ahora'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  methodLabel: { color: colors.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: { width: '48%', minHeight: 46, borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  methodActive: { borderColor: colors.primary, backgroundColor: '#123653' },
  methodText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  methodTextActive: { color: '#FFF', fontWeight: 'bold' },
  label: { color: colors.muted, fontSize: 14 },
  amount: { color: '#10B981', fontSize: 20, fontWeight: 'bold' },
  payBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  cancelBtn: { backgroundColor: '#123653', borderWidth: 1, borderColor: '#334155', padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#FFF', fontWeight: 'bold' },
  payText: { color: '#FFF', fontWeight: 'bold' },
});