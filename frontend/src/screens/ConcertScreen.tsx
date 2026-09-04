import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../theme';

export default function ConcertsScreen() {
  const navigation = useNavigation<any>();

  // =========================================================
  // FILTROS
  // =========================================================

  const [selectedCity, setSelectedCity] = useState('TODAS');
  const [selectedDate, setSelectedDate] = useState('TODAS');

  const [showCities, setShowCities] = useState(false);
  const [showDates, setShowDates] = useState(false);

  // =========================================================
  // CIUDADES
  // =========================================================

  const cities = [
    'TODAS',
    'QUITO',
    'CUENCA',
    'GUAYAQUIL',
    'SANTO DOMINGO',
    'MACHALA',
    'MANTA',
    'PORTOVIEJO',
    'AMBATO',
    'RIOBAMBA',
    'LOJA',
    'IBARRA',
    'ESMERALDAS',
    'QUEVEDO',
    'BABAHOYO',
    'SALINAS',
    'SANTA ELENA',
  ];

  // =========================================================
  // FECHAS
  // =========================================================

  const dates = [
    'TODAS',
    'AGOSTO - 2026',
    'SEPTIEMBRE - 2026',
    'OCTUBRE - 2026',
    'NOVIEMBRE - 2026',
    'DICIEMBRE - 2026',
    'ENERO - 2027',
    'FEBRERO - 2027',
    'MARZO - 2027',
    'ABRIL - 2027',
    'MAYO - 2027',
    'JUNIO - 2027',
    'JULIO - 2027',
    'AGOSTO - 2027',
    'SEPTIEMBRE - 2027',
    'OCTUBRE - 2027',
    'NOVIEMBRE - 2027',
    'DICIEMBRE - 2027',
  ];

  // =========================================================
  // CONCIERTOS
  // =========================================================

  const concerts = [
    {
      id: '1',
      title: 'Festival de Música Ecuador',
      city: 'QUITO',
      venue: 'Coliseo Rumiñahui',
      date: '15 Sep 2026',
      month: 'SEPTIEMBRE - 2026',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 50,
        platinum: 70,
      },
    },
    {
      id: '2',
      title: 'Noche de Conciertos',
      city: 'GUAYAQUIL',
      venue: 'Estadio Modelo',
      date: '20 Sep 2026',
      month: 'SEPTIEMBRE - 2026',
      time: '19:30',
      prices: {
        general: 30,
        preferential: 40,
        vip: 60,
        platinum: 80,
      },
    },
    {
      id: '3',
      title: 'Concierto Internacional',
      city: 'CUENCA',
      venue: 'Coliseo Jefferson Pérez',
      date: '27 Sep 2026',
      month: 'SEPTIEMBRE - 2026',
      time: '20:00',
      prices: {
        general: 35,
        preferential: 45,
        vip: 65,
        platinum: 90,
      },
    },
    {
      id: '4',
      title: 'Quito Music Fest',
      city: 'QUITO',
      venue: 'Parque Bicentenario',
      date: '10 Oct 2026',
      month: 'OCTUBRE - 2026',
      time: '19:00',
      prices: {
        general: 25,
        preferential: 40,
        vip: 55,
        platinum: 75,
      },
    },
    {
      id: '5',
      title: 'Festival Costa Música',
      city: 'MANTA',
      venue: 'Plaza Cívica',
      date: '17 Oct 2026',
      month: 'OCTUBRE - 2026',
      time: '20:30',
      prices: {
        general: 30,
        preferential: 40,
        vip: 60,
        platinum: 85,
      },
    },
    {
      id: '6',
      title: 'Noche Latina',
      city: 'SANTO DOMINGO',
      venue: 'Estadio Olímpico',
      date: '24 Oct 2026',
      month: 'OCTUBRE - 2026',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 55,
        platinum: 75,
      },
    },
    {
      id: '7',
      title: 'Machala Music Night',
      city: 'MACHALA',
      venue: 'Coliseo 9 de Octubre',
      date: '7 Nov 2026',
      month: 'NOVIEMBRE - 2026',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 50,
        platinum: 70,
      },
    },
    {
      id: '8',
      title: 'Festival del Pacífico',
      city: 'GUAYAQUIL',
      venue: 'Centro de Convenciones',
      date: '14 Nov 2026',
      month: 'NOVIEMBRE - 2026',
      time: '19:30',
      prices: {
        general: 35,
        preferential: 45,
        vip: 65,
        platinum: 90,
      },
    },
    {
      id: '9',
      title: 'Cuenca Live',
      city: 'CUENCA',
      venue: 'Coliseo Jefferson Pérez',
      date: '28 Nov 2026',
      month: 'NOVIEMBRE - 2026',
      time: '20:00',
      prices: {
        general: 30,
        preferential: 40,
        vip: 60,
        platinum: 85,
      },
    },
    {
      id: '10',
      title: 'Christmas Music Fest',
      city: 'QUITO',
      venue: 'Coliseo Rumiñahui',
      date: '12 Dic 2026',
      month: 'DICIEMBRE - 2026',
      time: '19:00',
      prices: {
        general: 30,
        preferential: 45,
        vip: 65,
        platinum: 95,
      },
    },
    {
      id: '11',
      title: 'Fin de Año Musical',
      city: 'PORTOVIEJO',
      venue: 'Complejo La California',
      date: '19 Dic 2026',
      month: 'DICIEMBRE - 2026',
      time: '21:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 55,
        platinum: 75,
      },
    },
    {
      id: '12',
      title: 'Festival de Verano',
      city: 'SALINAS',
      venue: 'Malecón de Salinas',
      date: '16 Ene 2027',
      month: 'ENERO - 2027',
      time: '20:30',
      prices: {
        general: 30,
        preferential: 40,
        vip: 60,
        platinum: 85,
      },
    },
    {
      id: '13',
      title: 'Loja Music Experience',
      city: 'LOJA',
      venue: 'Coliseo Ciudad de Loja',
      date: '13 Feb 2027',
      month: 'FEBRERO - 2027',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 50,
        platinum: 70,
      },
    },
    {
      id: '14',
      title: 'Festival Sierra Norte',
      city: 'IBARRA',
      venue: 'Coliseo Luis Leoro Franco',
      date: '20 Mar 2027',
      month: 'MARZO - 2027',
      time: '19:30',
      prices: {
        general: 25,
        preferential: 35,
        vip: 55,
        platinum: 75,
      },
    },
    {
      id: '15',
      title: 'Ambato Music Fest',
      city: 'AMBATO',
      venue: 'Coliseo de Ambato',
      date: '17 Abr 2027',
      month: 'ABRIL - 2027',
      time: '20:00',
      prices: {
        general: 30,
        preferential: 40,
        vip: 60,
        platinum: 80,
      },
    },
    {
      id: '16',
      title: 'Festival Musical del Ecuador',
      city: 'RIOBAMBA',
      venue: 'Coliseo Teodoro Gallegos',
      date: '15 May 2027',
      month: 'MAYO - 2027',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 50,
        platinum: 70,
      },
    },
    {
      id: '17',
      title: 'Esmeraldas Music Night',
      city: 'ESMERALDAS',
      venue: 'Centro Cívico',
      date: '19 Jun 2027',
      month: 'JUNIO - 2027',
      time: '20:00',
      prices: {
        general: 25,
        preferential: 35,
        vip: 55,
        platinum: 75,
      },
    },
    {
      id: '18',
      title: 'Festival Nacional de Música',
      city: 'QUITO',
      venue: 'Parque Bicentenario',
      date: '17 Jul 2027',
      month: 'JULIO - 2027',
      time: '19:30',
      prices: {
        general: 35,
        preferential: 45,
        vip: 65,
        platinum: 95,
      },
    },
  ];

  // =========================================================
  // FILTRAR
  // =========================================================

  const filteredConcerts = useMemo(() => {
    return concerts.filter((concert) => {
      const cityMatch =
        selectedCity === 'TODAS' ||
        concert.city === selectedCity;

      const dateMatch =
        selectedDate === 'TODAS' ||
        concert.month === selectedDate;

      return cityMatch && dateMatch;
    });
  }, [selectedCity, selectedDate]);

  // =========================================================
  // COMPRAR
  // =========================================================

  const handleBuy = (concert: any) => {
    navigation.navigate('SeatSelection', {
      type: 'concert',
      eventType: 'concert',

      title: concert.title,
      movieTitle: concert.title,
      event: concert,

      city: concert.city,
      venue: concert.venue,
      date: concert.date,
      time: concert.time,

      showtimeId: concert.id,

      price: concert.prices.general,

      prices: concert.prices,

      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        columns: 8,
      },

      occupiedSeats: [],
    });
  };

  // =========================================================
  // CIUDAD
  // =========================================================

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCities(false);
  };

  // =========================================================
  // FECHA
  // =========================================================

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDates(false);
  };

  // =========================================================
  // PUNTOS DE VENTA
  // =========================================================

  const physicalLocations = [
    {
      city: 'QUITO',
      places: [
        'Centro Comercial Quicentro',
        'Centro Comercial El Recreo',
        'CCI - Centro Comercial Iñaquito',
        'Plaza de las Américas',
      ],
    },
    {
      city: 'GUAYAQUIL',
      places: [
        'Mall del Sol',
        'San Marino Shopping',
        'CityMall',
        'Mall del Sur',
      ],
    },
    {
      city: 'CUENCA',
      places: [
        'Mall del Río',
        'Centro de Cuenca',
        'Plaza del Río',
      ],
    },
    {
      city: 'MANTA',
      places: [
        'Mall del Pacífico',
        'Centro de Manta',
      ],
    },
    {
      city: 'MACHALA',
      places: [
        'Mall del Sur',
        'Centro de Machala',
      ],
    },
    {
      city: 'AMBATO',
      places: [
        'Mall de los Andes',
        'Centro de Ambato',
      ],
    },
    {
      city: 'LOJA',
      places: [
        'Centro de Loja',
        'Plaza Central',
      ],
    },
    {
      city: 'PORTOVIEJO',
      places: [
        'Centro de Portoviejo',
        'Plaza Cívica',
      ],
    },
  ];

  const handlePhysicalPurchase = (
    city: string,
    place: string
  ) => {
    Alert.alert(
      'Compra de boleto físico',
      `Punto de venta seleccionado:\n\n${place}\n${city}\n\nAcércate a este punto para comprar tus entradas.`,
      [
        {
          text: 'Entendido',
        },
      ]
    );
  };

  // =========================================================
  // REGRESAR
  // =========================================================

  const handleBack = () => {
    navigation.goBack();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
            accessibilityLabel="Regresar a Eventos"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.smallTitle}>
              TICKETSAFE
            </Text>

            <Text style={styles.title}>
              Conciertos
            </Text>

            <Text style={styles.subtitle}>
              Vive la música en Ecuador
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="musical-notes"
              size={25}
              color={colors.primary}
            />
          </View>

        </View>

        {/* ==================================================
            BANNER
        ================================================== */}

        <View style={styles.banner}>

          <View style={styles.bannerIcon}>
            <Ionicons
              name="musical-notes"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              Próximos conciertos
            </Text>

            <Text style={styles.bannerSubtitle}>
              Compra tus entradas de forma rápida y segura.
            </Text>
          </View>

        </View>

        {/* ==================================================
            FILTROS
        ================================================== */}

        <View style={styles.filtersSection}>

          {/* CIUDAD */}

          <View style={styles.filterContainer}>

            <Pressable
              style={({ pressed }) => [
                styles.filterButton,
                showCities && styles.filterButtonOpen,
                pressed && styles.filterButtonPressed,
              ]}
              onPress={() => {
                setShowCities(!showCities);
                setShowDates(false);
              }}
            >

              <View style={styles.filterButtonLeft}>

                <View style={styles.filterIcon}>
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color={colors.primary}
                  />
                </View>

                <View>
                  <Text style={styles.filterLabel}>
                    CIUDAD
                  </Text>

                  <Text style={styles.filterSelected}>
                    {selectedCity}
                  </Text>
                </View>

              </View>

              <Ionicons
                name={
                  showCities
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={18}
                color={colors.textSecondary}
              />

            </Pressable>

            {showCities && (
              <View style={styles.dropdown}>

                <Text style={styles.dropdownTitle}>
                  Selecciona una ciudad
                </Text>

                <ScrollView
                  nestedScrollEnabled
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {cities.map((city) => (
                    <Pressable
                      key={city}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        selectedCity === city &&
                          styles.dropdownItemSelected,
                        pressed &&
                          styles.dropdownItemPressed,
                      ]}
                      onPress={() =>
                        handleCitySelect(city)
                      }
                    >

                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedCity === city &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {city}
                      </Text>

                      {selectedCity === city && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      )}

                    </Pressable>
                  ))}
                </ScrollView>

              </View>
            )}

          </View>

          {/* FECHA */}

          <View style={styles.filterContainer}>

            <Pressable
              style={({ pressed }) => [
                styles.filterButton,
                showDates && styles.filterButtonOpen,
                pressed && styles.filterButtonPressed,
              ]}
              onPress={() => {
                setShowDates(!showDates);
                setShowCities(false);
              }}
            >

              <View style={styles.filterButtonLeft}>

                <View style={styles.filterIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={colors.primary}
                  />
                </View>

                <View>
                  <Text style={styles.filterLabel}>
                    FECHA
                  </Text>

                  <Text style={styles.filterSelected}>
                    {selectedDate}
                  </Text>
                </View>

              </View>

              <Ionicons
                name={
                  showDates
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={18}
                color={colors.textSecondary}
              />

            </Pressable>

            {showDates && (
              <View style={styles.dropdown}>

                <Text style={styles.dropdownTitle}>
                  Selecciona un mes
                </Text>

                <ScrollView
                  nestedScrollEnabled
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {dates.map((date) => (
                    <Pressable
                      key={date}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        selectedDate === date &&
                          styles.dropdownItemSelected,
                        pressed &&
                          styles.dropdownItemPressed,
                      ]}
                      onPress={() =>
                        handleDateSelect(date)
                      }
                    >

                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedDate === date &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {date}
                      </Text>

                      {selectedDate === date && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      )}

                    </Pressable>
                  ))}
                </ScrollView>

              </View>
            )}

          </View>

        </View>

        {/* ==================================================
            FILTROS ACTIVOS
        ================================================== */}

        <View style={styles.activeFilters}>

          <View style={styles.activeFilter}>

            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />

            <Text style={styles.activeFilterText}>
              {selectedCity}
            </Text>

          </View>

          <View style={styles.activeFilter}>

            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.primary}
            />

            <Text style={styles.activeFilterText}>
              {selectedDate}
            </Text>

          </View>

        </View>

        {/* ==================================================
            EVENTOS
        ================================================== */}

        <View style={styles.sectionHeader}>

          <View>
            <Text style={styles.sectionEyebrow}>
              CARTELERA
            </Text>

            <Text style={styles.sectionTitle}>
              Eventos disponibles
            </Text>
          </View>

          <View style={styles.resultsBadge}>
            <Text style={styles.resultsText}>
              {filteredConcerts.length}
            </Text>

            <Text style={styles.resultsLabel}>
              eventos
            </Text>
          </View>

        </View>

        {/* ==================================================
            SIN RESULTADOS
        ================================================== */}

        {filteredConcerts.length === 0 ? (

          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>
              <Ionicons
                name="musical-notes-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No hay conciertos disponibles
            </Text>

            <Text style={styles.emptyText}>
              Prueba seleccionando otra ciudad o fecha.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.resetButtonPressed,
              ]}
              onPress={() => {
                setSelectedCity('TODAS');
                setSelectedDate('TODAS');
              }}
            >
              <Text style={styles.resetButtonText}>
                Ver todos los conciertos
              </Text>
            </Pressable>

          </View>

        ) : (

          filteredConcerts.map((concert) => (

            <View
              key={concert.id}
              style={styles.card}
            >

              {/* ==================================================
                  CABECERA DE TARJETA
              ================================================== */}

              <View style={styles.imagePlaceholder}>

                <View style={styles.musicCircle}>
                  <Ionicons
                    name="musical-notes"
                    size={34}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.concertBadge}>
                  <Text style={styles.concertBadgeText}>
                    CONCIERTO
                  </Text>
                </View>

              </View>

              {/* ==================================================
                  INFORMACIÓN
              ================================================== */}

              <View style={styles.cardContent}>

                <Text style={styles.concertTitle}>
                  {concert.title}
                </Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.infoText}>
                    {concert.city} · {concert.venue}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.infoText}>
                    {concert.date}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.infoText}>
                    {concert.time}
                  </Text>
                </View>

                {/* ==================================================
                    TIPOS DE ENTRADA
                ================================================== */}

                <View style={styles.ticketHeader}>

                  <Text style={styles.ticketTypeTitle}>
                    Tipos de entrada
                  </Text>

                  <Text style={styles.ticketHint}>
                    Desde
                  </Text>

                </View>

                <View style={styles.ticketTypes}>

                  <View style={styles.ticketType}>
                    <Text style={styles.ticketTypeName}>
                      GENERAL
                    </Text>

                    <Text style={styles.ticketTypePrice}>
                      ${concert.prices.general.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.ticketType}>
                    <Text style={styles.ticketTypeName}>
                      PREFERENCIAL
                    </Text>

                    <Text style={styles.ticketTypePrice}>
                      ${concert.prices.preferential.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.ticketType}>
                    <Text style={styles.ticketTypeName}>
                      VIP
                    </Text>

                    <Text style={styles.ticketTypePrice}>
                      ${concert.prices.vip.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.ticketType}>
                    <Text style={styles.ticketTypeName}>
                      PLATINO
                    </Text>

                    <Text style={styles.ticketTypePrice}>
                      ${concert.prices.platinum.toFixed(2)}
                    </Text>
                  </View>

                </View>

                {/* ==================================================
                    PRECIO + COMPRAR
                ================================================== */}

                <View style={styles.bottomRow}>

                  <View>
                    <Text style={styles.priceLabel}>
                      Entrada desde
                    </Text>

                    <Text style={styles.price}>
                      ${concert.prices.general.toFixed(2)}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.buyButton,
                      pressed && styles.buyButtonPressed,
                    ]}
                    onPress={() =>
                      handleBuy(concert)
                    }
                  >

                    <Text style={styles.buyText}>
                      Comprar
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#FFFFFF"
                    />

                  </Pressable>

                </View>

              </View>

            </View>

          ))
        )}

        {/* ==================================================
            COMPRA DE BOLETOS FÍSICOS
        ================================================== */}

        <View style={styles.physicalSection}>

          <View style={styles.physicalHeader}>

            <View style={styles.physicalIcon}>
              <Ionicons
                name="ticket-outline"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={styles.physicalHeaderText}>

              <Text style={styles.physicalTitle}>
                Compra tus boletos físicos
              </Text>

              <Text style={styles.physicalSubtitle}>
                También puedes adquirir tus entradas
                presencialmente en nuestros puntos de venta.
              </Text>

            </View>

          </View>

          {/* PUNTOS DE VENTA */}

          {physicalLocations.map((location) => (

            <View
              key={location.city}
              style={styles.locationCard}
            >

              <View style={styles.locationTitleRow}>

                <View style={styles.locationIcon}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.locationCity}>
                  {location.city}
                </Text>

              </View>

              {location.places.map((place) => (

                <Pressable
                  key={place}
                  style={({ pressed }) => [
                    styles.physicalPlace,
                    pressed &&
                      styles.physicalPlacePressed,
                  ]}
                  onPress={() =>
                    handlePhysicalPurchase(
                      location.city,
                      place
                    )
                  }
                >

                  <View style={styles.placeLeft}>

                    <Ionicons
                      name="storefront-outline"
                      size={17}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.placeText}>
                      {place}
                    </Text>

                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.primary}
                  />

                </Pressable>

              ))}

            </View>

          ))}

        </View>

        {/* ==================================================
            INFORMACIÓN FINAL
        ================================================== */}

        <View style={styles.infoBox}>

          <View style={styles.infoBoxIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoBoxText}>

            <Text style={styles.infoBoxTitle}>
              Compra segura
            </Text>

            <Text style={styles.infoBoxDescription}>
              Tus entradas son gestionadas de forma
              segura por TicketSafe.
            </Text>

          </View>

        </View>

        <View style={styles.footerSpace} />

      </ScrollView>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // GENERAL
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 40,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  headerInfo: {
    flex: 1,
  },

  smallTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 2,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.18)',
  },

  // ==========================================================
  // BANNER
  // ==========================================================

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  bannerIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bannerText: {
    flex: 1,
    marginLeft: 13,
  },

  bannerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },

  bannerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // ==========================================================
  // FILTROS
  // ==========================================================

  filtersSection: {
    marginBottom: 10,
  },

  filterContainer: {
    width: '100%',
    marginBottom: 9,
  },

  filterButton: {
    minHeight: 58,
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  filterButtonOpen: {
    borderColor: 'rgba(14,165,233,0.45)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  filterButtonPressed: {
    opacity: 0.8,
  },

  filterButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  filterLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  filterSelected: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  // ==========================================================
  // DROPDOWN
  // ==========================================================

  dropdown: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(14,165,233,0.45)',
  },

  dropdownTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingTop: 10,
    paddingBottom: 6,
    letterSpacing: 0.5,
  },

  dropdownScroll: {
    maxHeight: 220,
  },

  dropdownItem: {
    minHeight: 39,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },

  dropdownItemSelected: {
    backgroundColor: colors.background,
  },

  dropdownItemPressed: {
    opacity: 0.65,
  },

  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  dropdownItemTextSelected: {
    color: colors.text,
    fontWeight: '900',
  },

  // ==========================================================
  // FILTROS ACTIVOS
  // ==========================================================

  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 22,
  },

  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.14)',
  },

  activeFilterText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  // ==========================================================
  // SECCIÓN
  // ==========================================================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },

  resultsBadge: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
  },

  resultsText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  resultsLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  // ==========================================================
  // TARJETAS
  // ==========================================================

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  imagePlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  musicCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.20)',
  },

  concertBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  concertBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cardContent: {
    padding: 15,
  },

  concertTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 11,
  },

  // ==========================================================
  // INFORMACIÓN DEL EVENTO
  // ==========================================================

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  infoIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },

  // ==========================================================
  // TIPOS DE ENTRADA
  // ==========================================================

  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },

  ticketTypeTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },

  ticketHint: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },

  ticketTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  ticketType: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  ticketTypeName: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  ticketTypePrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  // ==========================================================
  // PRECIO + BOTÓN
  // ==========================================================

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },

  priceLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },

  price: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 1,
  },

  buyButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 11,
    paddingHorizontal: 15,
    gap: 6,
  },

  buyButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  buyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // ==========================================================
  // SIN RESULTADOS
  // ==========================================================

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 11,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 10,
    marginTop: 14,
  },

  resetButtonPressed: {
    opacity: 0.75,
  },

  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // ==========================================================
  // BOLETOS FÍSICOS
  // ==========================================================

  physicalSection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  physicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  physicalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  physicalHeaderText: {
    flex: 1,
  },

  physicalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },

  physicalSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  locationCard: {
    backgroundColor: colors.background,
    borderRadius: 13,
    padding: 11,
    marginBottom: 10,
  },

  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationCity: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 7,
  },

  physicalPlace: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },

  physicalPlacePressed: {
    opacity: 0.6,
  },

  placeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  placeText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  },

  // ==========================================================
  // INFORMACIÓN FINAL
  // ==========================================================

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.12)',
  },

  infoBoxIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoBoxText: {
    flex: 1,
    marginLeft: 10,
  },

  infoBoxTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },

  infoBoxDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 2,
  },

  footerSpace: {
    height: 25,
  },

});