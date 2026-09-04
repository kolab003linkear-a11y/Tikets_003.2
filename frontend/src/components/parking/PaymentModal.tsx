import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../../theme';

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
              <Ionicons name="close" size={24} color={colors.textSecondary} />
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
                <Ionicons name={method.icon} size={17} color={selectedMethod === method.key ? colors.primary : colors.textSecondary} />
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
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
            <Text style={styles.payText}>{processing ? 'Procesando pago...' : parkingOnly ? 'Pagar y habilitar salida' : 'Pagar ahora'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: radii.large, borderTopRightRadius: radii.large, gap: 16, ...shadows.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  methodLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: { width: '48%', minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  methodText: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  methodTextActive: { color: colors.text, fontWeight: 'bold' },
  label: { color: colors.textSecondary, fontSize: 14 },
  amount: { color: colors.success, fontSize: 20, fontWeight: 'bold' },
  payBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: radii.control, alignItems: 'center', ...shadows.button },
  payBtnDisabled: { opacity: 0.6 },
  cancelBtn: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: radii.control, alignItems: 'center' },
  cancelText: { color: colors.text, fontWeight: 'bold' },
  payText: { color: colors.text, fontWeight: 'bold' },
});