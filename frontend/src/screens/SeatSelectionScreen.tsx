import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {
  cancelReservation,
  createReservation,
} from '../api/client';

import { useAuth } from '../auth/AuthContext';

import { colors } from '../theme';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';

// =========================================================
// CONFIGURACIÓN
// =========================================================

const defaultRows = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
];

const defaultColumns = 8;

const TEXT_MUTED = '#94A3B8';

// =========================================================
// PANTALLA
// =========================================================

export default function SeatSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    user,
    token,
    startGuestSession,
  } = useAuth();

  // =======================================================
  // PARÁMETROS
  // =======================================================

  const {
    showtimeId,
    movieTitle,
    price,
    seatLayout,
    occupiedSeats = [],

    type,
    eventType,

    title,
    city,
    venue,
    date,
    time,

    zone: initialZone,
    ticketType: initialTicketType,

    prices = {},
  } = route.params ?? {};

  // =======================================================
  // TIPO DE EVENTO
  // =======================================================

  const normalizedType =
    String(type ?? '').toLowerCase();

  const normalizedEventType =
    String(eventType ?? '').toLowerCase();

  const isConcert =
    normalizedType === 'concert' ||
    normalizedType === 'concierto' ||
    normalizedEventType === 'concert' ||
    normalizedEventType === 'concierto';

  const isTheater =
    normalizedType === 'theater' ||
    normalizedType === 'teatro' ||
    normalizedEventType === 'theater' ||
    normalizedEventType === 'teatro';

  const isCinema =
    !isConcert && !isTheater;

  // =======================================================
  // TÍTULO
  // =======================================================

  const eventTitle =
    isConcert
      ? title ||
        movieTitle ||
        'Concierto'
      : isTheater
        ? movieTitle ||
          title ||
          'Obra de teatro'
        : movieTitle ||
          title ||
          'Película';

  // =======================================================
  // PRECIOS CONCIERTO
  // =======================================================

  const concertPrices = {
    general:
      Number(prices?.general) || 25,

    preferential:
      Number(
        prices?.preferential ??
          prices?.preferencial,
      ) || 35,

    vip:
      Number(prices?.vip) || 50,

    platinum:
      Number(
        prices?.platinum ??
          prices?.platino,
      ) || 70,
  };

  // =======================================================
  // ESTADOS
  // =======================================================

  const [
    selectedSeats,
    setSelectedSeats,
  ] = useState<string[]>([]);

  const [
    selectedZone,
    setSelectedZone,
  ] = useState<string>(
    String(
      initialZone ||
        initialTicketType ||
        'GENERAL',
    ).toUpperCase(),
  );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(300);

  const [
    reserving,
    setReserving,
  ] = useState(false);

  const reservingRef =
    useRef(false);

  const [
    pendingReservationId,
    setPendingReservationId,
  ] = useState<string | null>(null);

  const checkoutStartedRef =
    useRef(false);

  const [
    fullName,
    setFullName,
  ] = useState(
    user?.fullName ?? '',
  );

  const [
    phone,
    setPhone,
  ] = useState(
    user?.phone ?? '',
  );

  const [
    email,
    setEmail,
  ] = useState(
    user?.email ?? '',
  );

  // =======================================================
  // ACTUALIZAR DATOS DEL USUARIO
  // =======================================================

  useEffect(() => {
    if (user?.fullName) {
      setFullName(
        user.fullName,
      );
    }

    if (user?.phone) {
      setPhone(
        user.phone,
      );
    }

    if (user?.email) {
      setEmail(
        user.email,
      );
    }
  }, [
    user?.fullName,
    user?.phone,
    user?.email,
  ]);

  // =======================================================
  // LAYOUT
  // =======================================================

  const layout = useMemo(() => {
    const rows =
      Array.isArray(
        seatLayout?.rows,
      ) &&
      seatLayout.rows.length > 0
        ? seatLayout.rows
        : defaultRows;

    const columns =
      typeof seatLayout?.columns ===
        'number' &&
      seatLayout.columns > 0
        ? seatLayout.columns
        : defaultColumns;

    return {
      rows,
      columns,
    };
  }, [seatLayout]);

  // =======================================================
  // ASIENTOS OCUPADOS
  // =======================================================

  const occupiedSet = useMemo(() => {
    return new Set(
      Array.isArray(
        occupiedSeats,
      )
        ? occupiedSeats.map(
            (seat: any) =>
              String(seat),
          )
        : [],
    );
  }, [occupiedSeats]);

  // =======================================================
  // TEMPORIZADOR
  // =======================================================

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const interval =
      setInterval(() => {
        setTimeLeft(
          current =>
            current > 0
              ? current - 1
              : 0,
        );
      }, 1000);

    return () => {
      clearInterval(
        interval,
      );
    };
  }, [timeLeft]);

  // =======================================================
  // CUANDO TERMINA EL TIEMPO
  // =======================================================

  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    const expireReservation =
      async () => {
        const reservationId =
          pendingReservationId;

        if (
          reservationId &&
          token
        ) {
          try {
            await cancelReservation(
              token,
              reservationId,
            );
          } catch (error) {
            console.log(
              'No se pudo cancelar la reserva:',
              error,
            );
          }

          setPendingReservationId(
            null,
          );
        }

        if (
          !checkoutStartedRef.current
        ) {
          Alert.alert(
            'Tiempo agotado',
            'La selección de entradas ha expirado. Vuelve a intentarlo.',
            [
              {
                text: 'Aceptar',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ],
          );
        }
      };

    expireReservation();
  }, [
    timeLeft,
    pendingReservationId,
    token,
    navigation,
  ]);

  // =======================================================
  // CANCELAR RESERVA AL SALIR
  // =======================================================

  useEffect(() => {
    return () => {
      if (
        pendingReservationId &&
        token &&
        !checkoutStartedRef.current
      ) {
        cancelReservation(
          token,
          pendingReservationId,
        ).catch(() => {});
      }
    };
  }, [
    pendingReservationId,
    token,
  ]);

  // =======================================================
  // SELECCIONAR ASIENTO
  // =======================================================

  const toggleSeat = (
    seatId: string,
  ) => {
    if (
      reserving ||
      timeLeft <= 0
    ) {
      return;
    }

    if (
      occupiedSet.has(
        seatId,
      )
    ) {
      return;
    }

    setSelectedSeats(
      current => {
        if (
          current.includes(
            seatId,
          )
        ) {
          return current.filter(
            seat =>
              seat !==
              seatId,
          );
        }

        return [
          ...current,
          seatId,
        ];
      },
    );
  };

  // =======================================================
  // PRECIO CONCIERTO
  // =======================================================

  const selectedConcertPrice =
    selectedZone === 'VIP'
      ? concertPrices.vip
      : selectedZone ===
          'PLATINO'
        ? concertPrices.platinum
        : selectedZone ===
            'PREFERENCIAL'
          ? concertPrices.preferential
          : concertPrices.general;

  // =======================================================
  // PRECIO CINE / TEATRO
  // =======================================================

  const seatPrice =
    Number(price) || 0;

  // =======================================================
  // TOTAL
  // =======================================================

  const total =
    isConcert
      ? quantity *
        selectedConcertPrice
      : selectedSeats.length *
        seatPrice;

  // =======================================================
  // CAMBIAR ZONA
  // =======================================================

  const changeZone = (
    zone: string,
  ) => {
    if (
      reserving ||
      timeLeft <= 0
    ) {
      return;
    }

    setSelectedZone(
      zone.toUpperCase(),
    );
  };

  // =======================================================
  // CANTIDAD
  // =======================================================

  const decreaseQuantity =
    () => {
      if (
        reserving ||
        timeLeft <= 0
      ) {
        return;
      }

      setQuantity(
        current =>
          Math.max(
            1,
            current - 1,
          ),
      );
    };

  const increaseQuantity =
    () => {
      if (
        reserving ||
        timeLeft <= 0
      ) {
        return;
      }

      setQuantity(
        current =>
          Math.min(
            10,
            current + 1,
          ),
      );
    };

  // =======================================================
  // CÓDIGOS PARA CONCIERTO
  // =======================================================

  const concertTicketCodes =
    useMemo(() => {
      if (!isConcert) {
        return [];
      }

      return Array.from(
        {
          length: quantity,
        },
        (_, index) =>
          `${selectedZone}-${index + 1}`,
      );
    }, [
      isConcert,
      quantity,
      selectedZone,
    ]);

  // =======================================================
  // ZONA TEATRO
  // =======================================================

  const getTheaterZone = (
    rowIndex: number,
  ) => {
    if (rowIndex <= 2) {
      return 'PLATEA';
    }

    if (rowIndex <= 5) {
      return 'LUNETA';
    }

    return 'TERRAZA';
  };

  // =======================================================
  // ABANDONAR RESERVA
  // =======================================================

  const abandonPendingReservation =
    async (
      showConfirmation = false,
    ) => {
      const reservationId =
        pendingReservationId;

      if (
        !reservationId ||
        !token
      ) {
        if (
          showConfirmation
        ) {
          navigation.goBack();
        }

        return;
      }

      try {
        await cancelReservation(
          token,
          reservationId,
        );

        setPendingReservationId(
          null,
        );

        if (
          showConfirmation
        ) {
          navigation.goBack();
        }
      } catch (error) {
        console.log(
          'Error cancelando reserva:',
          error,
        );

        if (
          showConfirmation
        ) {
          navigation.goBack();
        }
      }
    };

  // =======================================================
  // CONTINUAR AL CHECKOUT
  // =======================================================

  const goToCheckout =
    async () => {
      if (
        reservingRef.current ||
        reserving
      ) {
        return;
      }

      if (timeLeft <= 0) {
        Alert.alert(
          'Tiempo agotado',
          'La selección ya no está disponible.',
        );

        return;
      }

      // ---------------------------------------------------
      // CONCIERTO
      // ---------------------------------------------------

      if (isConcert) {
        if (!selectedZone) {
          Alert.alert(
            'Selecciona una zona',
            'Debes seleccionar una localidad para continuar.',
          );

          return;
        }

        if (
          quantity < 1 ||
          quantity > 10
        ) {
          Alert.alert(
            'Cantidad inválida',
            'Selecciona entre 1 y 10 entradas.',
          );

          return;
        }
      }

      // ---------------------------------------------------
      // CINE / TEATRO
      // ---------------------------------------------------

      if (
        !isConcert &&
        selectedSeats.length ===
          0
      ) {
        Alert.alert(
          isTheater
            ? 'Selecciona tus butacas'
            : 'Selecciona tus asientos',
          isTheater
            ? 'Debes seleccionar al menos una butaca para continuar.'
            : 'Debes seleccionar al menos un asiento para continuar.',
        );

        return;
      }

      // ---------------------------------------------------
      // DATOS CLIENTE
      // ---------------------------------------------------

      const cleanEmail =
        email.trim();

      const cleanName =
        fullName.trim();

      const cleanPhone =
        phone.trim();

      if (!cleanEmail) {
        Alert.alert(
          'Correo requerido',
          'Ingresa tu correo electrónico para continuar.',
        );

        return;
      }

      if (!cleanName) {
        Alert.alert(
          'Nombre requerido',
          'Ingresa tu nombre completo para continuar.',
        );

        return;
      }

      if (!cleanPhone) {
        Alert.alert(
          'Teléfono requerido',
          'Ingresa tu número de teléfono para continuar.',
        );

        return;
      }

      reservingRef.current =
        true;

      setReserving(true);

      try {
        // =================================================
        // SESIÓN
        // =================================================

        let sessionToken:
          | string
          | null =
          token ?? null;

        let sessionUser: any =
          user ?? null;

        // -------------------------------------------------
        // SESIÓN INVITADO
        // -------------------------------------------------

        if (
          !sessionToken ||
          !sessionUser?.id
        ) {
          const guestSession: any =
            await (
              startGuestSession as any
            )(
              cleanName,
              cleanEmail,
              cleanPhone,
            );

          if (
            guestSession?.token
          ) {
            sessionToken =
              guestSession.token;
          }

          if (
            guestSession?.user
          ) {
            sessionUser =
              guestSession.user;
          }

          if (
            !sessionToken &&
            guestSession?.accessToken
          ) {
            sessionToken =
              guestSession.accessToken;
          }

          if (
            !sessionToken &&
            guestSession
              ?.data
              ?.token
          ) {
            sessionToken =
              guestSession.data.token;
          }

          if (
            !sessionUser?.id &&
            guestSession
              ?.data
              ?.user
          ) {
            sessionUser =
              guestSession.data.user;
          }

          if (
            !sessionToken ||
            !sessionUser?.id
          ) {
            throw new Error(
              'No se pudo iniciar la sesión invitado. Verifica que el correo electrónico sea válido.',
            );
          }
        }

        // =================================================
        // ASIENTOS / ENTRADAS
        // =================================================

        const reservationSeats =
          isConcert
            ? concertTicketCodes
            : selectedSeats;

        if (
          !reservationSeats.length
        ) {
          throw new Error(
            'No hay entradas seleccionadas.',
          );
        }

        // =================================================
        // CREAR RESERVA
        // =================================================

        const response =
          await createReservation(
            sessionToken,
            sessionUser.id,
            showtimeId,
            reservationSeats,
          );

        const reservationId =
          response?.reservation?.id;

        if (
          !reservationId
        ) {
          throw new Error(
            'El servidor no devolvió el ID de la reserva.',
          );
        }

        setPendingReservationId(
          String(
            reservationId,
          ),
        );

        checkoutStartedRef.current =
          true;

        // =================================================
        // CHECKOUT
        // =================================================

        navigation.navigate(
          'Checkout',
          {
            reservationId,

            selectedSeats:
              reservationSeats,

            ticketCount:
              isConcert
                ? quantity
                : selectedSeats.length,

            total,

            showtimeId,

            movieTitle:
              eventTitle,

            authToken:
              sessionToken,

            type:
              isConcert
                ? 'concert'
                : isTheater
                  ? 'theater'
                  : type,

            eventType:
              isConcert
                ? 'concert'
                : isTheater
                  ? 'theater'
                  : eventType,

            title,

            city,

            venue,

            date,

            time,

            zone:
              isConcert
                ? selectedZone
                : undefined,

            ticketType:
              isConcert
                ? selectedZone
                : undefined,

            ticketPrice:
              isConcert
                ? selectedConcertPrice
                : seatPrice,

            prices:
              isConcert
                ? concertPrices
                : undefined,

            fullName:
              cleanName,

            phone:
              cleanPhone,

            email:
              cleanEmail,
          },
        );
      } catch (
        error: any
      ) {
        console.log(
          'Error creando reserva:',
          error,
        );

        const message =
          String(
            error?.message ||
              error?.response
                ?.data
                ?.message ||
              error ||
              '',
          );

        const lowerMessage =
          message.toLowerCase();

        // =================================================
        // ASIENTO / ENTRADA OCUPADA
        // =================================================

        if (
          lowerMessage.includes(
            'already reserved',
          ) ||
          lowerMessage.includes(
            'already booked',
          ) ||
          lowerMessage.includes(
            'seat already',
          ) ||
          lowerMessage.includes(
            'ya está reservado',
          ) ||
          lowerMessage.includes(
            'ya esta reservado',
          ) ||
          lowerMessage.includes(
            'ocupado',
          )
        ) {
          if (isConcert) {
            Alert.alert(
              'Entradas no disponibles',
              'La zona seleccionada ya no tiene disponibilidad. Selecciona otra zona o reduce la cantidad.',
            );
          } else {
            setSelectedSeats(
              current =>
                current.filter(
                  seat =>
                    !occupiedSet.has(
                      seat,
                    ),
                ),
            );

            Alert.alert(
              'Asiento no disponible',
              'Uno de los asientos seleccionados acaba de ser ocupado. Selecciona otros asientos.',
            );
          }

          return;
        }

        // =================================================
        // SESIÓN
        // =================================================

        if (
          lowerMessage.includes(
            'unauthorized',
          ) ||
          lowerMessage.includes(
            'unauthenticated',
          ) ||
          lowerMessage.includes(
            'token',
          )
        ) {
          Alert.alert(
            'Sesión no disponible',
            'No se pudo validar tu sesión. Vuelve a intentarlo.',
          );

          return;
        }

        // =================================================
        // ERROR GENERAL
        // =================================================

        Alert.alert(
          'No se pudo reservar',
          message ||
            'Ocurrió un error al crear la reserva. Intenta nuevamente.',
        );
      } finally {
        reservingRef.current =
          false;

        setReserving(false);
      }
    };

  // =======================================================
  // TEMPORIZADOR VISUAL
  // =======================================================

  const minutes =
    String(
      Math.floor(
        timeLeft / 60,
      ),
    ).padStart(2, '0');

  const seconds =
    String(
      timeLeft % 60,
    ).padStart(2, '0');

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              abandonPendingReservation(
                true,
              )
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.headerEyebrow
              }
            >
              {isConcert
                ? 'ENTRADAS'
                : isTheater
                  ? 'TEATRO'
                  : 'CINE'}
            </Text>

            <Text
              style={
                styles.headerTitle
              }
            >
              Selecciona tu lugar
            </Text>
          </View>

          <View
            style={[
              styles.timerBadge,
              timeLeft <= 60 &&
                styles.timerDanger,
            ]}
          >
            <Text
              style={
                styles.timerIcon
              }
            >
              ⏱
            </Text>

            <Text
              style={
                styles.timerText
              }
            >
              {minutes}:{seconds}
            </Text>
          </View>
        </View>

        {/* =================================================
            INFORMACIÓN DEL EVENTO
        ================================================= */}

        <View
          style={
            styles.eventInfoCard
          }
        >
          <View
            style={
              styles.eventIconBox
            }
          >
            <Text
              style={
                styles.eventIcon
              }
            >
              {isConcert
                ? '♫'
                : isTheater
                  ? '🎭'
                  : '🎬'}
            </Text>
          </View>

          <View
            style={
              styles.eventInfoContent
            }
          >
            <Text
              style={
                styles.eventTitle
              }
            >
              {eventTitle}
            </Text>

            {city ? (
              <Text
                style={
                  styles.eventMeta
                }
              >
                📍 {city}
              </Text>
            ) : null}

            {venue ? (
              <Text
                style={
                  styles.eventMeta
                }
              >
                🏛 {venue}
              </Text>
            ) : null}

            {date || time ? (
              <Text
                style={
                  styles.eventMeta
                }
              >
                📅 {date || ''}
                {date && time
                  ? ' • '
                  : ''}
                {time || ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* =================================================
            CONCIERTO
        ================================================= */}

        {isConcert && (
          <>
            <View
              style={
                styles.sectionCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Elige tu localidad
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Toca una zona para
                seleccionarla
              </Text>

              <View
                style={
                  styles.concertMap
                }
              >
                <View
                  style={
                    styles.concertStage
                  }
                >
                  <Text
                    style={
                      styles.concertStageText
                    }
                  >
                    ESCENARIO
                  </Text>
                </View>

                {/* PLATINO */}

                <Pressable
                  onPress={() =>
                    changeZone(
                      'PLATINO',
                    )
                  }
                  style={[
                    styles.concertZone,
                    styles.platinumZone,
                    selectedZone ===
                      'PLATINO' &&
                      styles.selectedConcertZone,
                  ]}
                >
                  <Text
                    style={
                      styles.zoneIcon
                    }
                  >
                    ★
                  </Text>

                  <Text
                    style={
                      styles.concertZoneTitle
                    }
                  >
                    PLATINO
                  </Text>

                  <Text
                    style={
                      styles.concertZonePrice
                    }
                  >
                    $
                    {
                      concertPrices.platinum
                    }
                  </Text>
                </Pressable>

                {/* VIP */}

                <Pressable
                  onPress={() =>
                    changeZone(
                      'VIP',
                    )
                  }
                  style={[
                    styles.concertZone,
                    styles.vipZone,
                    selectedZone ===
                      'VIP' &&
                      styles.selectedConcertZone,
                  ]}
                >
                  <Text
                    style={
                      styles.zoneIcon
                    }
                  >
                    ◆
                  </Text>

                  <Text
                    style={
                      styles.concertZoneTitle
                    }
                  >
                    VIP
                  </Text>

                  <Text
                    style={
                      styles.concertZonePrice
                    }
                  >
                    $
                    {
                      concertPrices.vip
                    }
                  </Text>
                </Pressable>

                {/* PREFERENCIAL */}

                <Pressable
                  onPress={() =>
                    changeZone(
                      'PREFERENCIAL',
                    )
                  }
                  style={[
                    styles.concertZone,
                    styles.preferentialZone,
                    selectedZone ===
                      'PREFERENCIAL' &&
                      styles.selectedConcertZone,
                  ]}
                >
                  <Text
                    style={
                      styles.zoneIcon
                    }
                  >
                    ●
                  </Text>

                  <Text
                    style={
                      styles.concertZoneTitle
                    }
                  >
                    PREFERENCIAL
                  </Text>

                  <Text
                    style={
                      styles.concertZonePrice
                    }
                  >
                    $
                    {
                      concertPrices.preferential
                    }
                  </Text>
                </Pressable>

                {/* GENERAL */}

                <Pressable
                  onPress={() =>
                    changeZone(
                      'GENERAL',
                    )
                  }
                  style={[
                    styles.concertZone,
                    styles.generalZone,
                    selectedZone ===
                      'GENERAL' &&
                      styles.selectedConcertZone,
                  ]}
                >
                  <Text
                    style={
                      styles.zoneIcon
                    }
                  >
                    ○
                  </Text>

                  <Text
                    style={
                      styles.concertZoneTitle
                    }
                  >
                    GENERAL
                  </Text>

                  <Text
                    style={
                      styles.concertZonePrice
                    }
                  >
                    $
                    {
                      concertPrices.general
                    }
                  </Text>
                </Pressable>
              </View>

              <View
                style={
                  styles.selectedZoneIndicator
                }
              >
                <View
                  style={
                    styles.selectedDot
                  }
                />

                <Text
                  style={
                    styles.selectedZoneText
                  }
                >
                  Zona seleccionada:{' '}
                  <Text
                    style={
                      styles.selectedZoneStrong
                    }
                  >
                    {selectedZone}
                  </Text>
                </Text>
              </View>
            </View>

            {/* CANTIDAD */}

            <View
              style={
                styles.sectionCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                ¿Cuántas entradas?
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Máximo 10 entradas
              </Text>

              <View
                style={
                  styles.quantityContainer
                }
              >
                <Pressable
                  onPress={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1 ||
                    reserving ||
                    timeLeft <= 0
                  }
                  style={[
                    styles.quantityButton,
                    (
                      quantity <=
                        1 ||
                      reserving ||
                      timeLeft <=
                        0
                    ) &&
                      styles.quantityButtonDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.quantityButtonText
                    }
                  >
                    −
                  </Text>
                </Pressable>

                <View
                  style={
                    styles.quantityNumberBox
                  }
                >
                  <Text
                    style={
                      styles.quantityNumber
                    }
                  >
                    {quantity}
                  </Text>

                  <Text
                    style={
                      styles.quantityLabel
                    }
                  >
                    entradas
                  </Text>
                </View>

                <Pressable
                  onPress={
                    increaseQuantity
                  }
                  disabled={
                    quantity >= 10 ||
                    reserving ||
                    timeLeft <= 0
                  }
                  style={[
                    styles.quantityButton,
                    (
                      quantity >=
                        10 ||
                      reserving ||
                      timeLeft <=
                        0
                    ) &&
                      styles.quantityButtonDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.quantityButtonText
                    }
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* RESUMEN CONCIERTO */}

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Resumen de tu selección
              </Text>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Zona
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {selectedZone}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Entradas
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {quantity}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Precio unitario
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  $
                  {selectedConcertPrice.toFixed(
                    2,
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.summaryDivider
                }
              />

              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  TOTAL
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  $
                  {total.toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* =================================================
            TEATRO
        ================================================= */}

        {isTheater && (
          <>
            {/* INTRO TEATRO */}

            <View
              style={
                styles.theaterIntroCard
              }
            >
              <View
                style={
                  styles.theaterIntroIcon
                }
              >
                <Text
                  style={
                    styles.theaterIntroEmoji
                  }
                >
                  🎭
                </Text>
              </View>

              <View
                style={
                  styles.theaterIntroContent
                }
              >
                <Text
                  style={
                    styles.theaterIntroTitle
                  }
                >
                  Teatro Nacional Sucre
                </Text>

                <Text
                  style={
                    styles.theaterIntroText
                  }
                >
                  Selecciona tus butacas.
                  La distribución visual
                  está inspirada en un
                  teatro clásico de Quito.
                </Text>
              </View>
            </View>

            {/* MAPA TEATRO */}

            <View
              style={
                styles.theaterCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Mapa de la sala
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Toca una butaca para
                seleccionarla
              </Text>

              {/* ESCENARIO */}

              <View
                style={
                  styles.theaterStageArea
                }
              >
                <View
                  style={
                    styles.theaterCurtain
                  }
                />

                <View
                  style={
                    styles.theaterStage
                  }
                >
                  <Text
                    style={
                      styles.theaterStageSmall
                    }
                  >
                    TELÓN
                  </Text>

                  <Text
                    style={
                      styles.theaterStageText
                    }
                  >
                    ESCENARIO
                  </Text>

                  <Text
                    style={
                      styles.theaterStageSmall
                    }
                  >
                    🎭
                  </Text>
                </View>

                <View
                  style={
                    styles.theaterCurtain
                  }
                />
              </View>

              {/* PALCOS Y PLATEA */}

              <View
                style={
                  styles.theaterBalconyRow
                }
              >
                <View
                  style={
                    styles.theaterBalcony
                  }
                >
                  <Text
                    style={
                      styles.theaterBalconyText
                    }
                  >
                    PALCO
                  </Text>

                  <Text
                    style={
                      styles.theaterBalconySub
                    }
                  >
                    IZQ.
                  </Text>
                </View>

                <View
                  style={
                    styles.theaterMainLabel
                  }
                >
                  <Text
                    style={
                      styles.theaterZoneTitle
                    }
                  >
                    PLATEA
                  </Text>

                  <Text
                    style={
                      styles.theaterZoneSub
                    }
                  >
                    Zona principal
                  </Text>
                </View>

                <View
                  style={
                    styles.theaterBalcony
                  }
                >
                  <Text
                    style={
                      styles.theaterBalconyText
                    }
                  >
                    PALCO
                  </Text>

                  <Text
                    style={
                      styles.theaterBalconySub
                    }
                  >
                    DER.
                  </Text>
                </View>
              </View>

              {/* BUTACAS */}

              <View
                style={
                  styles.seatMapContainer
                }
              >
                {layout.rows.map(
                  (
                    row: string,
                    rowIndex: number,
                  ) => {
                    const theaterZone =
                      getTheaterZone(
                        rowIndex,
                      );

                    return (
                      <View
                        key={String(
                          row,
                        )}
                        style={
                          styles.theaterRow
                        }
                      >
                        <View
                          style={
                            styles.rowLabelBox
                          }
                        >
                          <Text
                            style={
                              styles.rowLabel
                            }
                          >
                            {String(
                              row,
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.seatsRow
                          }
                        >
                          {Array.from(
                            {
                              length:
                                layout.columns,
                            },
                            (
                              _,
                              columnIndex,
                            ) => {
                              const seatId =
                                `${String(
                                  row,
                                )}${
                                  columnIndex +
                                  1
                                }`;

                              const isOccupied =
                                occupiedSet.has(
                                  seatId,
                                );

                              const isSelected =
                                selectedSeats.includes(
                                  seatId,
                                );

                              /*
                               * IMPORTANTE:
                               *
                               * Platea, Luneta y Terraza
                               * utilizan ahora el MISMO
                               * color base del cine.
                               *
                               * Ya no se utilizan tonos
                               * vino, morados o dorados.
                               */

                              const zoneStyle =
                                styles.theaterSeat;

                              return (
                                <Pressable
                                  key={
                                    seatId
                                  }
                                  onPress={() =>
                                    toggleSeat(
                                      seatId,
                                    )
                                  }
                                  disabled={
                                    isOccupied ||
                                    reserving ||
                                    timeLeft <=
                                      0
                                  }
                                  style={[
                                    zoneStyle,

                                    isOccupied &&
                                      styles.occupiedSeat,

                                    isSelected &&
                                      styles.selectedSeat,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.theaterSeatText,

                                      isOccupied &&
                                        styles.occupiedSeatText,

                                      isSelected &&
                                        styles.selectedSeatText,
                                    ]}
                                  >
                                    {isOccupied
                                      ? '×'
                                      : isSelected
                                        ? '✓'
                                        : columnIndex +
                                          1}
                                  </Text>
                                </Pressable>
                              );
                            },
                          )}
                        </View>

                        <View
                          style={
                            styles.rowLabelBox
                          }
                        >
                          <Text
                            style={
                              styles.rowLabel
                            }
                          >
                            {String(
                              row,
                            )}
                          </Text>
                        </View>
                      </View>
                    );
                  },
                )}
              </View>

              {/* TERRAZA */}

              <View
                style={
                  styles.terraceArea
                }
              >
                <Text
                  style={
                    styles.terraceTitle
                  }
                >
                  TERRAZA / GALERÍA
                </Text>

                <Text
                  style={
                    styles.terraceText
                  }
                >
                  Zona posterior de la sala
                </Text>
              </View>

              {/* LEYENDA */}

              <View
                style={
                  styles.legendContainer
                }
              >
                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendAvailable
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Disponible
                  </Text>
                </View>

                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendSelected
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Seleccionado
                  </Text>
                </View>

                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendOccupied
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Ocupado
                  </Text>
                </View>
              </View>
            </View>

            {/* RESUMEN TEATRO */}

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Resumen de tu selección
              </Text>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Butacas
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {selectedSeats.length}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Seleccionadas
                </Text>

                <Text
                  style={
                    styles.summaryValueSeats
                  }
                >
                  {selectedSeats.length
                    ? selectedSeats.join(
                        ', ',
                      )
                    : 'Ninguna'}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Precio por butaca
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  $
                  {seatPrice.toFixed(
                    2,
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.summaryDivider
                }
              />

              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  TOTAL
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  $
                  {total.toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* =================================================
            CINE
        ================================================= */}

        {isCinema && (
          <>
            <View
              style={
                styles.cinemaCard
              }
            >
              <View
                style={
                  styles.cinemaStage
                }
              >
                <Text
                  style={
                    styles.cinemaStageText
                  }
                >
                  PANTALLA
                </Text>
              </View>

              <Text
                style={
                  styles.cinemaHint
                }
              >
                Selecciona tus asientos
              </Text>

              <View
                style={
                  styles.cinemaSeatsContainer
                }
              >
                {layout.rows.map(
                  (
                    row: string,
                  ) => (
                    <View
                      key={String(
                        row,
                      )}
                      style={
                        styles.cinemaRow
                      }
                    >
                      <Text
                        style={
                          styles.cinemaRowLabel
                        }
                      >
                        {String(
                          row,
                        )}
                      </Text>

                      <View
                        style={
                          styles.cinemaSeatList
                        }
                      >
                        {Array.from(
                          {
                            length:
                              layout.columns,
                          },
                          (
                            _,
                            columnIndex,
                          ) => {
                            const seatId =
                              `${String(
                                row,
                              )}${
                                columnIndex +
                                1
                              }`;

                            const isOccupied =
                              occupiedSet.has(
                                seatId,
                              );

                            const isSelected =
                              selectedSeats.includes(
                                seatId,
                              );

                            return (
                              <Pressable
                                key={
                                  seatId
                                }
                                onPress={() =>
                                  toggleSeat(
                                    seatId,
                                  )
                                }
                                disabled={
                                  isOccupied ||
                                  reserving ||
                                  timeLeft <=
                                    0
                                }
                                style={[
                                  styles.cinemaSeat,

                                  isOccupied &&
                                    styles.occupiedSeat,

                                  isSelected &&
                                    styles.selectedSeat,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.cinemaSeatText,

                                    isOccupied &&
                                      styles.occupiedSeatText,

                                    isSelected &&
                                      styles.selectedSeatText,
                                  ]}
                                >
                                  {isOccupied
                                    ? '×'
                                    : isSelected
                                      ? '✓'
                                      : columnIndex +
                                        1}
                                </Text>
                              </Pressable>
                            );
                          },
                        )}
                      </View>
                    </View>
                  ),
                )}
              </View>

              {/* LEYENDA CINE */}

              <View
                style={
                  styles.legendContainer
                }
              >
                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendAvailable
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Disponible
                  </Text>
                </View>

                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendSelected
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Seleccionado
                  </Text>
                </View>

                <View
                  style={
                    styles.legendItem
                  }
                >
                  <View
                    style={
                      styles.legendOccupied
                    }
                  />

                  <Text
                    style={
                      styles.legendText
                    }
                  >
                    Ocupado
                  </Text>
                </View>
              </View>
            </View>

            {/* RESUMEN CINE */}

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Resumen
              </Text>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Asientos
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {selectedSeats.length}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Seleccionados
                </Text>

                <Text
                  style={
                    styles.summaryValueSeats
                  }
                >
                  {selectedSeats.length
                    ? selectedSeats.join(
                        ', ',
                      )
                    : 'Ninguno'}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRow
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Precio por asiento
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  $
                  {seatPrice.toFixed(
                    2,
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.summaryDivider
                }
              />

              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  TOTAL
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  $
                  {total.toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* =================================================
            DATOS CLIENTE
        ================================================= */}

        {(!user?.fullName ||
          !user?.phone ||
          !user?.email) && (
          <View
            style={
              styles.profileCard
            }
          >
            <Text
              style={
                styles.profileTitle
              }
            >
              Datos para tu compra
            </Text>

            <Text
              style={
                styles.profileSubtitle
              }
            >
              Completa tus datos para
              continuar al pago.
            </Text>

            <AppInput
              label="Nombre completo"
              value={fullName}
              onChangeText={
                setFullName
              }
              placeholder="Ej. Melanie Quimbita"
            />

            <AppInput
              label="Teléfono"
              value={phone}
              onChangeText={
                setPhone
              }
              placeholder="Ej. 0999999999"
              keyboardType="phone-pad"
            />

            <AppInput
              label="Correo electrónico"
              value={email}
              onChangeText={
                setEmail
              }
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* =================================================
            BOTONES
        ================================================= */}

        <View
          style={
            styles.bottomActions
          }
        >
          <AppButton
            label={
              reserving
                ? 'Reservando...'
                : `Continuar al pago • $${total.toFixed(
                    2,
                  )}`
            }
            onPress={
              goToCheckout
            }
            disabled={
              reserving ||
              timeLeft <= 0 ||
              (isConcert
                ? !selectedZone ||
                  quantity < 1
                : selectedSeats.length ===
                  0)
            }
          />

          <Pressable
            onPress={() =>
              Alert.alert(
                'Cancelar selección',
                '¿Seguro que deseas cancelar tu selección?',
                [
                  {
                    text: 'No',
                    style: 'cancel',
                  },
                  {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () =>
                      abandonPendingReservation(
                        true,
                      ),
                  },
                ],
              )
            }
            disabled={
              reserving
            }
            style={
              styles.cancelButton
            }
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancelar selección
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({
  // =======================================================
  // GENERAL
  // =======================================================

  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  backButtonText: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

  headerEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },

  timerDanger: {
    backgroundColor:
      'rgba(244,63,94,0.18)',
  },

  timerIcon: {
    fontSize: 14,
    marginRight: 5,
  },

  timerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  // =======================================================
  // INFORMACIÓN DEL EVENTO
  // =======================================================

  eventInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.surfaceRaised,
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  eventIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(14,165,233,0.14)',
  },

  eventIcon: {
    fontSize: 25,
  },

  eventInfoContent: {
    flex: 1,
    marginLeft: 12,
  },

  eventTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  eventMeta: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
  },

  // =======================================================
  // CARDS
  // =======================================================

  sectionCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },

  // =======================================================
  // CONCIERTO
  // =======================================================

  concertMap: {
    backgroundColor:
      '#071C31',
    borderRadius: 22,
    padding: 15,
  },

  concertStage: {
    height: 48,
    borderRadius: 12,
    backgroundColor:
      '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 28,
    marginBottom: 14,
  },

  concertStageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  concertZone: {
    minHeight: 64,
    width: '84%',
    alignSelf: 'center',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 9,
  },

  platinumZone: {
    backgroundColor:
      'rgba(14,165,233,0.14)',
    borderColor:
      '#0EA5E9',
  },

  vipZone: {
    backgroundColor:
      'rgba(14,165,233,0.12)',
    borderColor:
      '#38BDF8',
  },

  preferentialZone: {
    backgroundColor:
      'rgba(56,189,248,0.10)',
    borderColor:
      '#38BDF8',
  },

  generalZone: {
    backgroundColor:
      'rgba(148,163,184,0.12)',
    borderColor:
      '#64748B',
  },

  selectedConcertZone: {
    transform: [
      {
        scale: 1.04,
      },
    ],
    borderWidth: 3,
    borderColor:
      colors.primary,
  },

  zoneIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 1,
  },

  concertZoneTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  concertZonePrice: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  selectedZoneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  selectedDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      colors.primary,
    marginRight: 8,
  },

  selectedZoneText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },

  selectedZoneStrong: {
    color: colors.text,
    fontWeight: '800',
  },

  // =======================================================
  // CANTIDAD
  // =======================================================

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor:
      colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonDisabled: {
    opacity: 0.35,
  },

  quantityButtonText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 30,
  },

  quantityNumberBox: {
    width: 105,
    alignItems: 'center',
  },

  quantityNumber: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },

  quantityLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 1,
  },

  // =======================================================
  // TEATRO - MISMO COLOR DEL CINE
  // =======================================================

  theaterIntroCard: {
    flexDirection: 'row',
    backgroundColor:
      colors.surface,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  theaterIntroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor:
      'rgba(14,165,233,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  theaterIntroEmoji: {
    fontSize: 26,
  },

  theaterIntroContent: {
    flex: 1,
    marginLeft: 12,
  },

  theaterIntroTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },

  theaterIntroText: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 17,
  },

  // =======================================================
  // TARJETA DEL TEATRO
  // =======================================================

  theaterCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 26,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  // =======================================================
  // ESCENARIO TEATRO
  // =======================================================

  theaterStageArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  theaterCurtain: {
    height: 48,
    width: 20,
    backgroundColor:
      '#1E293B',
    borderWidth: 1,
    borderColor:
      '#334155',
  },

  theaterStage: {
    height: 48,
    flex: 1,
    maxWidth: 260,
    backgroundColor:
      '#1E293B',
    borderWidth: 1,
    borderColor:
      '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  theaterStageSmall: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginHorizontal: 5,
  },

  theaterStageText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  // =======================================================
  // PALCOS
  // =======================================================

  theaterBalconyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  theaterBalcony: {
    width: 58,
    minHeight: 58,
    borderRadius: 10,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },

  theaterBalconyText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '900',
  },

  theaterBalconySub: {
    color: TEXT_MUTED,
    fontSize: 7,
    marginTop: 2,
  },

  theaterMainLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  theaterZoneTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  theaterZoneSub: {
    color: TEXT_MUTED,
    fontSize: 8,
    marginTop: 2,
  },

  // =======================================================
  // MAPA DE BUTACAS TEATRO
  // =======================================================

  seatMapContainer: {
    backgroundColor:
      '#0B1017',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.04)',
  },

  theaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  rowLabelBox: {
    width: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
  },

  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  // =======================================================
  // TODAS LAS BUTACAS DISPONIBLES
  // MISMO COLOR DEL CINE
  // =======================================================

  theaterSeat: {
    width: 25,
    height: 27,
    borderRadius: 7,
    backgroundColor:
      colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    marginHorizontal: 2,
  },

  /*
   * Estos tres estilos se mantienen por compatibilidad
   * con cualquier referencia existente, pero ahora todos
   * usan exactamente el mismo estilo azul/gris.
   */

  theaterPlatea: {
    width: 25,
    height: 27,
    borderRadius: 7,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  theaterLuneta: {
    width: 25,
    height: 27,
    borderRadius: 7,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  theaterTerraza: {
    width: 25,
    height: 27,
    borderRadius: 7,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  theaterSeatText: {
    color: TEXT_MUTED,
    fontSize: 8,
    fontWeight: '800',
  },

  // =======================================================
  // TERRAZA / GALERÍA
  // =======================================================

  terraceArea: {
    marginTop: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      '#475569',
    backgroundColor:
      colors.surfaceRaised,
    paddingVertical: 10,
    alignItems: 'center',
  },

  terraceTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  terraceText: {
    color: TEXT_MUTED,
    fontSize: 8,
    marginTop: 2,
  },

  // =======================================================
  // CINE
  // =======================================================

  cinemaCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  cinemaStage: {
    height: 46,
    borderRadius: 12,
    backgroundColor:
      '#1E293B',
    borderWidth: 1,
    borderColor:
      '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 25,
    marginBottom: 10,
  },

  cinemaStageText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  cinemaHint: {
    color: TEXT_MUTED,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 16,
  },

  cinemaSeatsContainer: {
    alignItems: 'center',
  },

  cinemaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  cinemaRowLabel: {
    width: 18,
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
  },

  cinemaSeatList: {
    flexDirection: 'row',
  },

  cinemaSeat: {
    width: 28,
    height: 29,
    borderRadius: 7,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  cinemaSeatText: {
    color: TEXT_MUTED,
    fontSize: 8,
    fontWeight: '800',
  },

  // =======================================================
  // ESTADOS DE ASIENTO
  // =======================================================

  occupiedSeat: {
    backgroundColor:
      colors.critical,
    borderColor:
      colors.critical,
    opacity: 0.65,
  },

  occupiedSeatText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  selectedSeat: {
    backgroundColor:
      colors.primary,
    borderColor:
      colors.primary,
    transform: [
      {
        scale: 1.08,
      },
    ],
  },

  selectedSeatText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // =======================================================
  // LEYENDA
  // =======================================================

  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 18,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 6,
  },

  // DISPONIBLE = IGUAL AL CINE
  legendAvailable: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor:
      colors.surfaceRaised,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    marginRight: 6,
  },

  // SELECCIONADO = AZUL
  legendSelected: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor:
      colors.primary,
    marginRight: 6,
  },

  // OCUPADO = ROJO
  legendOccupied: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor:
      colors.critical,
    marginRight: 6,
  },

  legendText: {
    color: TEXT_MUTED,
    fontSize: 10,
  },

  // =======================================================
  // RESUMEN
  // =======================================================

  summaryCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  summaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  summaryLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    flex: 1,
  },

  summaryValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  summaryValueSeats: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    maxWidth: '65%',
    textAlign: 'right',
  },

  summaryDivider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    marginVertical: 5,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  totalLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  totalValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },

  // =======================================================
  // DATOS CLIENTE
  // =======================================================

  profileCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  profileTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },

  profileSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 15,
    lineHeight: 18,
  },

  // =======================================================
  // BOTONES
  // =======================================================

  bottomActions: {
    marginTop: 2,
  },

  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 15,
  },

  cancelButtonText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
});