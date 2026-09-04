import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const colors = { primary: '#0EA5E9', success: '#14B8A6', card: '#102F4D', muted: '#94A3B8', text: '#F8FAFC', background: '#0A2540' };

interface ActiveTicketCardProps {
  ticketId: string;
  garageName: string;
  spotCode: string;
  onOpenPayment: () => void;
  qrPayload?: string;
  createdAt?: string;
  hourlyRate?: number;
}

export const ActiveTicketCard: React.FC<ActiveTicketCardProps> = ({
  ticketId,
  garageName,
  spotCode,
  onOpenPayment,
  qrPayload,
  createdAt,
  hourlyRate = 3.5,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => createdAt ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)) : 0);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const format = (value: number) => String(value).padStart(2, '0');
  const amount = Math.max(hourlyRate, hourlyRate * Math.max(1 / 60, elapsedSeconds / 3600));
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.badge}>TICKET ACTIVO</Text>
        <Text style={styles.spot}>Plaza {spotCode}</Text>
      </View>

      <Text style={styles.title}>{garageName}</Text>
      <Text style={styles.ticketId}>ID: {ticketId}</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerLabel}>TIEMPO TRANSCURRIDO</Text>
        <Text style={styles.timer}>{format(hours)} : {format(minutes)} : {format(seconds)}</Text>
        <Text style={styles.rate}>Tarifa acumulada: <Text style={styles.rateValue}>${amount.toFixed(2)}</Text></Text>
      </View>

      <View style={styles.qrBox} accessibilityLabel="Código QR del ticket de parqueadero">
        {qrPayload ? <QRCode value={qrPayload} size={156} color={colors.background} backgroundColor={colors.text} /> : <Ionicons name="qr-code-outline" size={90} color="#FFF" />}
        <Text style={styles.qrHint}>Presenta este codigo en la salida</Text>
      </View>

      <TouchableOpacity onPress={onOpenPayment} style={styles.payBtn}>
        <Ionicons name="card-outline" size={18} color="#FFF" />
        <Text style={styles.payText}>Pagar y Salir</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 20, gap: 10, borderWidth: 1, borderColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: colors.primary, fontSize: 10, fontWeight: 'bold' },
  spot: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  ticketId: { color: colors.muted, fontSize: 12 },
  qrBox: { backgroundColor: colors.text, alignSelf: 'center', width: 180, height: 180, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  qrHint: { color: colors.muted, fontSize: 11, marginTop: 8 },
  timerBox: { alignItems: 'center', paddingVertical: 8 },
  timerLabel: { color: colors.muted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  timer: { color: colors.success, fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  rate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  rateValue: { color: '#FFF', fontWeight: 'bold' },
  payBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  payText: { color: '#FFF', fontWeight: 'bold' },
});