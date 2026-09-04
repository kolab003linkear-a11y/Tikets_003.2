import React, { useEffect, useRef, useState } from 'react';

import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';

import { colors, typography } from '../theme';
import ProfileAvatar from '../components/ProfileAvatar';

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
    movieTitle = 'Entrada',
    selectedSeats = [],
    startTime,
    roomName,
  } = route.params ?? {};

  const tickets: TicketEntry[] = Array.isArray(ticketsParam) && ticketsParam.length > 0
    ? ticketsParam
    : [{
        ticketId,
        qrPayload,
        status,
        seatNumber: Array.isArray(selectedSeats) ? selectedSeats.join(', ') : selectedSeats,
      }];

  const [activeIndex, setActiveIndex] = useState(0);
  const scale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [glow, scale]);

  const formattedDate = startTime
    ? new Date(startTime).toLocaleString('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Horario pendiente';

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / 360);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const goToMyTickets = () => {
    navigation.navigate('HomeTabs', { screen: 'Mis Tickets' });
  };

  const goHome = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" style={styles.homeButton} onPress={goHome}>
              <Text style={styles.homeText}>← Inicio</Text>
            </Pressable>
            <View style={styles.profileButton}>
              <ProfileAvatar />
            </View>
          </View>

          <View style={styles.successBox}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>¡Compra confirmada!</Text>
              <Text style={styles.successText}>Tu entrada digital está lista.</Text>
            </View>
          </View>

          {tickets.length > 1 && (
            <Text style={styles.counter}>Entrada {activeIndex + 1} de {tickets.length} · desliza para ver las demás</Text>
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
              <View key={ticket.ticketId ?? index} style={[styles.page, { width: 360 }]}>
                <Animated.View style={[styles.ticketCard, { transform: [{ scale }], shadowOpacity: glow }]}>
                  <Animated.View style={[styles.glow, { opacity: glow }]} />
                  <Text style={styles.badge}>ENTRADA DIGITAL</Text>
                  <Text style={styles.title}>{movieTitle}</Text>
                  <View style={styles.divider} />

                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🎟️ Entradas</Text>
                      <Text style={styles.infoValue}>{tickets.length || 1}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>💺 Butacas</Text>
                      <Text style={styles.infoValue}>{ticket.seatNumber || 'Entrada general'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📅 Fecha</Text>
                      <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📍 Sala / Lugar</Text>
                      <Text style={styles.infoValue}>{roomName || 'Lugar pendiente'}</Text>
                    </View>
                  </View>

                  <View style={styles.statusBox}>
                    <View style={styles.statusDot} />
                    <Text style={styles.accessStatus}>ACCESO AUTORIZADO</Text>
                    <Text style={styles.statusText}>{ticket.status ?? status}</Text>
                  </View>

                  <View style={styles.qrSection}>
                    <Text style={styles.qrTitle}>Presenta este código QR</Text>
                    <Text style={styles.qrSubtitle}>Será escaneado al ingresar al evento</Text>
                    <View style={styles.qrBox} accessibilityLabel="Código QR de la entrada">
                      <QRCode value={ticket.qrPayload || ticket.ticketId || 'ticketsafe'} size={156} color={colors.background} backgroundColor={colors.text} />
                    </View>
                  </View>

                  <View style={styles.ticketIdBox}>
                    <Text style={styles.ticketIdLabel}>CÓDIGO DE TICKET</Text>
                    <Text style={styles.ticketId}>{ticket.ticketId || 'Pendiente'}</Text>
                  </View>
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

          <Pressable style={styles.myTicketsButton} onPress={goToMyTickets}>
            <Text style={styles.myTicketsText}>🎫 Ver mis tickets</Text>
          </Pressable>

          <Pressable style={styles.continueButton} onPress={goHome}>
            <Text style={styles.continueText}>Volver al inicio</Text>
          </Pressable>

          <Text style={styles.footerText}>Guarda tu entrada y presenta el código QR al momento de ingresar.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 70, backgroundColor: colors.background },
  header: { position: 'absolute', top: 18, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  homeButton: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  homeText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  profileButton: { alignItems: 'center', justifyContent: 'center' },
  successBox: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.success, padding: 14, marginBottom: 14 },
  successIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successIcon: { color: colors.background, fontSize: 23, fontWeight: '900' },
  successContent: { flex: 1 },
  successTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  successText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  counter: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  scrollArea: { width: '100%' },
  singlePageWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  ticketCard: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.success, shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, elevation: 12 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: colors.success, opacity: 0.1 },
  badge: { color: colors.success, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 10, fontFamily: typography.display },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  infoSection: { gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '18', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginTop: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 8 },
  accessStatus: { color: colors.success, fontSize: 12, fontWeight: '800' },
  statusText: { color: colors.textSecondary, fontSize: 11, marginLeft: 6, textTransform: 'uppercase' },
  qrSection: { alignItems: 'center', marginTop: 18 },
  qrTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  qrSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 12 },
  qrBox: { backgroundColor: colors.text, alignSelf: 'center', width: 180, height: 180, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  ticketIdBox: { marginTop: 18, alignItems: 'center' },
  ticketIdLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  ticketId: { color: colors.text, fontSize: 13, marginTop: 5 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.success, width: 18 },
  myTicketsButton: { width: '100%', maxWidth: 420, marginTop: 18, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  myTicketsText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  continueButton: { width: '100%', maxWidth: 420, marginTop: 10, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  continueText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  footerText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 12 },
});
