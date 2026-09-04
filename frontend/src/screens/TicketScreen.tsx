import React, { useEffect, useRef } from 'react';
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

export default function TicketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    ticketId,
    qrPayload,
    status = 'VALID',
    movieTitle = 'Entrada',
    selectedSeats = [],
    startTime,
    roomName,
  } = route.params ?? {};

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
          Animated.timing(glow, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),

          Animated.timing(glow, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
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

  const seatsText =
    selectedSeats.length > 0
      ? selectedSeats.join(', ')
      : 'Entrada general';

  const qrValue =
    qrPayload ||
    ticketId ||
    'ticketsafe';

  /*
   * IMPORTANTE:
   * "Mis Tickets" no es una pantalla Stack.
   * Es una pestaña dentro de HomeTabs.
   */
  const goToMyTickets = () => {
    navigation.navigate('HomeTabs', {
      screen: 'Mis Tickets',
    });
  };

  const goHome = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              style={styles.homeButton}
              onPress={goHome}
            >
              <Text style={styles.homeText}>
                ← Inicio
              </Text>
            </Pressable>

            <View style={styles.profileButton}>
              <ProfileAvatar />
            </View>
          </View>

          {/* COMPRA CONFIRMADA */}
          <View style={styles.successBox}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>
                ✓
              </Text>
            </View>

            <View style={styles.successContent}>
              <Text style={styles.successTitle}>
                ¡Compra confirmada!
              </Text>

              <Text style={styles.successText}>
                Tu entrada digital está lista.
              </Text>
            </View>
          </View>

          {/* TICKET */}
          <Animated.View
            style={[
              styles.ticketCard,
              {
                transform: [{ scale }],
                shadowOpacity: glow,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: glow,
                },
              ]}
            />

            <Text style={styles.badge}>
              ENTRADA DIGITAL
            </Text>

            <Text style={styles.title}>
              {movieTitle}
            </Text>

            <View style={styles.divider} />

            {/* INFORMACIÓN */}
            <View style={styles.infoSection}>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  🎟️ Entradas
                </Text>

                <Text style={styles.infoValue}>
                  {selectedSeats.length || 1}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  💺 Butacas
                </Text>

                <Text style={styles.infoValue}>
                  {seatsText}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  📅 Fecha
                </Text>

                <Text style={styles.infoValue}>
                  {formattedDate}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  📍 Sala / Lugar
                </Text>

                <Text style={styles.infoValue}>
                  {roomName || 'Lugar pendiente'}
                </Text>
              </View>

            </View>

            {/* ESTADO */}
            <View style={styles.statusBox}>
              <View style={styles.statusDot} />

              <Text style={styles.accessStatus}>
                ACCESO AUTORIZADO
              </Text>

              <Text style={styles.statusText}>
                {status}
              </Text>
            </View>

            {/* QR */}
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>
                Presenta este código QR
              </Text>

              <Text style={styles.qrSubtitle}>
                Será escaneado al ingresar al evento
              </Text>

              <View
                style={styles.qrBox}
                accessibilityLabel="Código QR de la entrada"
              >
                <QRCode
                  value={qrValue}
                  size={156}
                  color={colors.background}
                  backgroundColor={colors.text}
                />
              </View>
            </View>

            {/* ID DEL TICKET */}
            <View style={styles.ticketIdBox}>
              <Text style={styles.ticketIdLabel}>
                CÓDIGO DE TICKET
              </Text>

              <Text style={styles.ticketId}>
                {ticketId || 'Pendiente'}
              </Text>
            </View>

          </Animated.View>

          {/* MIS TICKETS */}
          <Pressable
            style={styles.myTicketsButton}
            onPress={goToMyTickets}
          >
            <Text style={styles.myTicketsText}>
              🎫 Ver mis tickets
            </Text>
          </Pressable>

          {/* INICIO */}
          <Pressable
            style={styles.continueButton}
            onPress={goHome}
          >
            <Text style={styles.continueText}>
              Volver al inicio
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            Guarda tu entrada y presenta el código QR
            al momento de ingresar.
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 70,
    backgroundColor: colors.background,
  },

  header: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },

  homeButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  homeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  successBox: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 14,
    marginBottom: 14,
  },

  successIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  successIcon: {
    color: colors.background,
    fontSize: 23,
    fontWeight: '900',
  },

  successContent: {
    flex: 1,
  },

  successTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  successText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  ticketCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 30,
    elevation: 12,
    overflow: 'hidden',
  },

  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: colors.success,
    opacity: 0.1,
  },

  badge: {
    color: colors.success,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 8,
  },

  title: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
    marginBottom: 14,
    fontFamily: typography.display,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 15,
  },

  infoSection: {
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },

  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '40',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 7,
  },

  accessStatus: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
    marginRight: 5,
  },

  statusText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },

  qrSection: {
    alignItems: 'center',
  },

  qrTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  qrSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },

  qrBox: {
    backgroundColor: colors.text,
    width: 180,
    height: 180,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  ticketIdBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    alignItems: 'center',
  },

  ticketIdLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  ticketId: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  myTicketsButton: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  myTicketsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  continueButton: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  continueText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 350,
  },
});
