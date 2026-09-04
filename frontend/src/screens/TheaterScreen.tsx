import React, { useRef, useState } from 'react';

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

type MenuItem =
  | 'Cartelera'
  | 'Servicios'
  | 'Funciones'
  | 'Noticias';

type TheaterFunction = {
  id: string;
  day: string;
  date: string;
  time: string;
  room: string;
  price: number;
};

type Play = {
  id: string;
  title: string;
  genre: string;
  duration: string;
  age: string;
  price: number;
};

export default function TheaterScreen() {
  const navigation = useNavigation<any>();

  const scrollRef = useRef<ScrollView>(null);

  const [activeMenu, setActiveMenu] =
    useState<MenuItem>('Cartelera');

  const [sectionPositions, setSectionPositions] =
    useState<Record<string, number>>({});

  /*
  ============================================================
  DATOS DE LA OBRA PRINCIPAL
  ============================================================
  */

  const featuredPlay = {
    id: 'recuerdame-dia-muertos',

    title: 'Recuérdame, Día de Muertos',

    shortTitle: 'Recuérdame',

    genre: 'Musical / Tradición mexicana',

    age: 'Todo público',

    duration: '2h aprox.',

    price: 20,

    city: 'Quito',

    venue: 'Teatro Scala',

    address:
      'QH7F+5ME, E28C, Quito 170517, Ecuador',

    description:
      'Espectáculo inspirado en la tradición mexicana del Día de Muertos, junto al Mariachi Internacional Sol de Plata. El escenario cobrará vida con catrinas, bailarines profesionales, cantantes e invitados especiales.',

    cast:
      'Mariachi Internacional Sol de Plata, ballet mexicano, cantantes y músicos.',

    production: 'Deyvixa Entertainment',

    genreDetail: 'Show musical',

    audience: 'Todo público',
  };

  /*
  ============================================================
  FUNCIONES TEATRALES DISPONIBLES
  ============================================================
  */

  const functions: TheaterFunction[] = [
    {
      id: 'recuerdame-viernes-30',
      day: 'VIERNES',
      date: '30 de octubre',
      time: '19:00',
      room: 'Sala Principal',
      price: 20,
    },

    {
      id: 'recuerdame-sabado-31',
      day: 'SÁBADO',
      date: '31 de octubre',
      time: '19:00',
      room: 'Sala Principal',
      price: 20,
    },
  ];

  /*
  ============================================================
  OTRAS OBRAS
  ============================================================
  */

  const otherPlays: Play[] = [
    {
      id: 'theater-romeo',
      title: 'Romeo y Julieta',
      genre: 'Drama / Clásico',
      duration: '2h',
      age: '+12',
      price: 20,
    },

    {
      id: 'theater-bernarda',
      title: 'La Casa de Bernarda Alba',
      genre: 'Drama',
      duration: '1h 45min',
      age: '+12',
      price: 18,
    },

    {
      id: 'theater-principito',
      title: 'El Principito',
      genre: 'Familiar',
      duration: '1h 30min',
      age: 'Todo público',
      price: 15,
    },

    {
      id: 'theater-don-juan',
      title: 'Don Juan Tenorio',
      genre: 'Drama / Romance',
      duration: '2h',
      age: '+12',
      price: 22,
    },

    {
      id: 'theater-otelo',
      title: 'Otelo',
      genre: 'Drama / Clásico',
      duration: '2h 10min',
      age: '+14',
      price: 24,
    },

    {
      id: 'theater-cenicienta',
      title: 'La Cenicienta',
      genre: 'Familiar / Musical',
      duration: '1h 30min',
      age: 'Todo público',
      price: 16,
    },

    {
      id: 'theater-alicia',
      title: 'Alicia en el País de las Maravillas',
      genre: 'Familiar / Fantasía',
      duration: '1h 40min',
      age: 'Todo público',
      price: 18,
    },

    {
      id: 'theater-mamma-mia',
      title: 'Mamma Mia!',
      genre: 'Musical / Comedia',
      duration: '2h 20min',
      age: 'Todo público',
      price: 28,
    },

    {
      id: 'theater-hamlet',
      title: 'Hamlet',
      genre: 'Drama / Clásico',
      duration: '2h 15min',
      age: '+14',
      price: 25,
    },

    {
      id: 'theater-rey-leon',
      title: 'El Rey León',
      genre: 'Musical / Familiar',
      duration: '2h',
      age: 'Todo público',
      price: 30,
    },

    {
      id: 'theater-chicago',
      title: 'Chicago',
      genre: 'Musical / Drama',
      duration: '2h 10min',
      age: '+16',
      price: 27,
    },

    {
      id: 'theater-vida-sueno',
      title: 'La Vida es Sueño',
      genre: 'Drama / Clásico',
      duration: '1h 50min',
      age: '+12',
      price: 20,
    },

    {
      id: 'theater-caperucita',
      title: 'Caperucita Roja',
      genre: 'Infantil / Familiar',
      duration: '1h 15min',
      age: 'Todo público',
      price: 12,
    },

    {
      id: 'theater-principe-feliz',
      title: 'El Príncipe Feliz',
      genre: 'Familiar / Teatro infantil',
      duration: '1h 20min',
      age: 'Todo público',
      price: 14,
    },

    {
      id: 'theater-comedia',
      title: 'Una Noche de Comedia',
      genre: 'Comedia / Stand Up',
      duration: '1h 30min',
      age: '+16',
      price: 18,
    },

    {
      id: 'theater-voces-ecuador',
      title: 'Voces del Ecuador',
      genre: 'Musical / Cultura',
      duration: '1h 45min',
      age: 'Todo público',
      price: 22,
    },

    {
      id: 'theater-magia',
      title: 'Magia en Escena',
      genre: 'Magia / Familiar',
      duration: '1h 20min',
      age: 'Todo público',
      price: 17,
    },

    {
      id: 'theater-fiesta',
      title: 'La Fiesta',
      genre: 'Comedia / Teatro',
      duration: '1h 40min',
      age: '+12',
      price: 19,
    },

    {
      id: 'theater-fantasma-opera',
      title: 'El Fantasma de la Ópera',
      genre: 'Musical / Drama / Romance',
      duration: '2h 30min',
      age: '+12',
      price: 30,
    },

    {
      id: 'theater-peter-pan',
      title: 'Peter Pan',
      genre: 'Familiar / Fantasía / Musical',
      duration: '1h 40min',
      age: 'Todo público',
      price: 18,
    },

    {
      id: 'theater-bella-bestia',
      title: 'La Bella y la Bestia',
      genre: 'Musical / Familiar',
      duration: '2h',
      age: 'Todo público',
      price: 25,
    },

    {
      id: 'theater-edipo-rey',
      title: 'Edipo Rey',
      genre: 'Drama / Clásico',
      duration: '1h 50min',
      age: '+14',
      price: 20,
    },

    {
      id: 'theater-aladdin',
      title: 'Aladdín: El Musical',
      genre: 'Musical / Fantasía / Familiar',
      duration: '2h',
      age: 'Todo público',
      price: 24,
    },
  ];

  /*
  ============================================================
  SERVICIOS
  ============================================================
  */

  const services = [
    {
      icon: 'ticket-outline',
      title: 'Venta de entradas',
      description:
        'Compra tus entradas de forma rápida y segura.',
    },

    {
      icon: 'people-outline',
      title: 'Eventos',
      description:
        'Disfruta de obras, musicales y espectáculos.',
    },

    {
      icon: 'shield-checkmark-outline',
      title: 'Compra segura',
      description:
        'Tus reservas y entradas están protegidas.',
    },

    {
      icon: 'card-outline',
      title: 'Pagos',
      description:
        'Paga tus entradas de manera sencilla y segura.',
    },
  ];

  /*
  ============================================================
  NOTICIAS
  ============================================================
  */

  const news = [
    {
      title: 'Nueva temporada teatral',
      description:
        'Disfruta de nuevas obras y espectáculos disponibles próximamente.',
    },

    {
      title: 'Recuérdame llega a Quito',
      description:
        'Vive una noche especial junto al Mariachi Internacional Sol de Plata.',
    },

    {
      title: 'Compra tus entradas',
      description:
        'Selecciona tus asientos y asegura tu lugar antes de la función.',
    },
  ];

  /*
  ============================================================
  VOLVER
  ============================================================
  */

  const handleBack = () => {
    navigation.goBack();
  };

  /*
  ============================================================
  GUARDAR POSICIÓN
  ============================================================
  */

  const saveSectionPosition = (
    section: string,
    y: number,
  ) => {
    setSectionPositions((previous) => ({
      ...previous,
      [section]: y,
    }));
  };

  /*
  ============================================================
  SCROLL A SECCIÓN
  ============================================================
  */

  const scrollToSection = (
    section: MenuItem,
  ) => {
    setActiveMenu(section);

    if (section === 'Cartelera') {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });

      return;
    }

    const y = sectionPositions[section];

    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - 15),
        animated: true,
      });
    }
  };

  /*
  ============================================================
  MENÚ
  ============================================================
  */

  const handleMenu = (item: MenuItem) => {
    scrollToSection(item);
  };

  /*
  ============================================================
  COMPRAR FUNCIÓN
  ============================================================
  */

  const handleBuyFunction = (
    func: TheaterFunction,
  ) => {
    navigation.navigate('SeatSelection', {
      type: 'theater',

      movieTitle: featuredPlay.title,

      play: {
        ...featuredPlay,

        functionDate:
          `${func.day} ${func.date}`,

        functionTime:
          func.time,

        date:
          `${func.day} ${func.date}`,

        time:
          func.time,

        room:
          func.room,

        city:
          featuredPlay.city,

        venue:
          featuredPlay.venue,

        address:
          featuredPlay.address,
      },

      showtimeId: func.id,

      price: func.price,

      seatLayout: {
        rows: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ],

        columns: 8,
      },

      occupiedSeats: [],
    });
  };

  /*
  ============================================================
  COMPRAR OTRA OBRA
  ============================================================
  */

  const handleOtherPlay = (
    play: Play,
  ) => {
    navigation.navigate('SeatSelection', {
      type: 'theater',

      movieTitle: play.title,

      play: {
        ...play,

        city: 'Quito',

        venue: 'Teatro Scala',

        address:
          'QH7F+5ME, E28C, Quito 170517, Ecuador',

        functionDate:
          'Próxima función',

        functionTime:
          '19:00',

        date:
          'Próxima función',

        time:
          '19:00',
      },

      showtimeId: play.id,

      price: play.price,

      seatLayout: {
        rows: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ],

        columns: 8,
      },

      occupiedSeats: [],
    });
  };

  /*
  ============================================================
  NOTICIAS
  ============================================================
  */

  const handleNews = (
    title: string,
    description: string,
  ) => {
    Alert.alert(
      title,
      description,
      [
        {
          text: 'Cerrar',
          style: 'cancel',
        },
      ],
    );
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
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
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerCenter}>

            <Text style={styles.brand}>
              TICKETSAFE
            </Text>

            <Text style={styles.headerTitle}>
              Teatro
            </Text>

            <Text style={styles.headerSubtitle}>
              Vive grandes historias en escena
            </Text>

          </View>

          <View style={styles.theaterIcon}>
            <Ionicons
              name="easel-outline"
              size={27}
              color={colors.primary}
            />
          </View>

        </View>

        {/* ==================================================
            MENÚ
        ================================================== */}

        <View style={styles.menuContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >

            {[
              'Cartelera',
              'Servicios',
              'Funciones',
              'Noticias',
            ].map((item) => (

              <Pressable
                key={item}
                onPress={() =>
                  handleMenu(item as MenuItem)
                }
                style={[
                  styles.menuItem,
                  activeMenu === item &&
                    styles.menuItemActive,
                ]}
              >

                <Text
                  style={[
                    styles.menuText,
                    activeMenu === item &&
                      styles.menuTextActive,
                  ]}
                >
                  {item}
                </Text>

              </Pressable>

            ))}

          </ScrollView>
        </View>

        {/* ==================================================
            CARTELERA
        ================================================== */}

        <View
          onLayout={(event) => {
            saveSectionPosition(
              'Cartelera',
              event.nativeEvent.layout.y,
            );
          }}
        >

          <View style={styles.hero}>

            <View style={styles.heroGlow} />

            <View style={styles.heroPoster}>

              <Ionicons
                name="sparkles"
                size={30}
                color={colors.primary}
              />

              <Text style={styles.posterTitle}>
                RECUÉRDAME
              </Text>

              <Text style={styles.posterSubtitle}>
                DÍA DE MUERTOS
              </Text>

              <View style={styles.posterDivider} />

              <Text style={styles.posterDate}>
                30 • 31
              </Text>

              <Text style={styles.posterMonth}>
                OCTUBRE
              </Text>

              <Text style={styles.posterMariachi}>
                MARIACHI INTERNACIONAL
              </Text>

              <Text style={styles.posterBand}>
                SOL DE PLATA
              </Text>

            </View>

            <View style={styles.heroInfo}>

              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>
                  Todo público
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Recuérdame,
                {'\n'}
                Día de Muertos
              </Text>

              <View style={styles.heroDateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.heroDate}>
                  Viernes 30 y sábado 31 de octubre
                </Text>
              </View>

              <View style={styles.heroDateRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.heroDate}>
                  19:00
                </Text>
              </View>

              <View style={styles.heroDateRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.heroDate}>
                  Teatro Scala · Quito
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.mainBuyButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  handleBuyFunction(functions[0])
                }
              >

                <Ionicons
                  name="ticket-outline"
                  size={20}
                  color={colors.text}
                />

                <Text style={styles.mainBuyText}>
                  Comprar entradas
                </Text>

              </Pressable>

            </View>
          </View>

          {/* ==================================================
              INFORMACIÓN
          ================================================== */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />

            <Text style={styles.sectionTitle}>
              Sobre la obra
            </Text>
          </View>

          <View style={styles.infoCard}>

            <Text style={styles.infoDescription}>
              {featuredPlay.description}
            </Text>

            <View style={styles.infoRows}>

              <InfoRow
                icon="musical-notes-outline"
                label="Género"
                value={featuredPlay.genreDetail}
              />

              <InfoRow
                icon="people-outline"
                label="Elenco"
                value={featuredPlay.cast}
              />

              <InfoRow
                icon="film-outline"
                label="Producción"
                value={featuredPlay.production}
              />

              <InfoRow
                icon="people-circle-outline"
                label="Público"
                value={featuredPlay.audience}
              />

              <InfoRow
                icon="time-outline"
                label="Duración"
                value={featuredPlay.duration}
              />

              <InfoRow
                icon="location-outline"
                label="Lugar"
                value={`${featuredPlay.venue} · ${featuredPlay.city}`}
              />

            </View>

          </View>

          {/* ==================================================
              FUNCIONES PRINCIPALES
          ================================================== */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />

            <Text style={styles.sectionTitle}>
              Funciones disponibles
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Selecciona una función para continuar con
            la selección de tus asientos.
          </Text>

          {functions.map((func) => (

            <View
              key={func.id}
              style={styles.functionCard}
            >

              {/* FECHA */}

              <View style={styles.functionDate}>

                <Text style={styles.functionDay}>
                  {func.day}
                </Text>

                <Text style={styles.functionNumber}>
                  {func.date.split(' ')[0]}
                </Text>

                <Text style={styles.functionMonth}>
                  OCT
                </Text>

              </View>

              {/* INFORMACIÓN */}

              <View style={styles.functionInfo}>

                <Text style={styles.functionTitle}>
                  RECUÉRDAME, DÍA DE MUERTOS
                </Text>

                <View style={styles.functionDetailRow}>

                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={colors.primary}
                  />

                  <Text style={styles.metaText}>
                    {func.day} {func.date}
                  </Text>

                </View>

                <View style={styles.functionDetailRow}>

                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={colors.primary}
                  />

                  <Text style={styles.metaText}>
                    {func.time}
                  </Text>

                </View>

                <View style={styles.functionDetailRow}>

                  <Ionicons
                    name="business-outline"
                    size={15}
                    color={colors.primary}
                  />

                  <Text style={styles.metaText}>
                    {func.room}
                  </Text>

                </View>

                <View style={styles.functionDetailRow}>

                  <Ionicons
                    name="location-outline"
                    size={15}
                    color={colors.primary}
                  />

                  <Text style={styles.metaText}>
                    Teatro Scala · Quito
                  </Text>

                </View>

                <Text style={styles.functionPrice}>
                  ${func.price.toFixed(2)}
                </Text>

              </View>

              {/* COMPRAR */}

              <Pressable
                style={({ pressed }) => [
                  styles.buyFunctionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  handleBuyFunction(func)
                }
              >

                <Ionicons
                  name="ticket"
                  size={18}
                  color={colors.text}
                />

                <Text style={styles.buyFunctionText}>
                  Comprar
                </Text>

              </Pressable>

            </View>

          ))}

          {/* ==================================================
              AVISO
          ================================================== */}

          <View style={styles.warningCard}>

            <View style={styles.warningIcon}>

              <Ionicons
                name="warning-outline"
                size={24}
                color={colors.primary}
              />

            </View>

            <View style={styles.warningContent}>

              <Text style={styles.warningTitle}>
                Aviso Importante
              </Text>

              <Text style={styles.warningText}>
                Una vez adquiridos los boletos online,
                o en boletería, o en caso de que no sean
                usados en la fecha de la función adquirida,
                no se aceptan devoluciones, ni cambios.
              </Text>

            </View>

          </View>

          {/* ==================================================
              FECHA
          ================================================== */}

          <View style={styles.smallSection}>

            <Text style={styles.smallSectionTitle}>
              Fecha
            </Text>

            <View style={styles.calendarRow}>

              <View style={styles.calendarCard}>

                <Text style={styles.calendarMonth}>
                  OCT.
                </Text>

                <Text style={styles.calendarDay}>
                  30
                </Text>

              </View>

              <View style={styles.calendarInfo}>

                <Text style={styles.calendarTitle}>
                  Viernes 30 de octubre
                </Text>

                <Text style={styles.calendarText}>
                  Función a las 19:00
                </Text>

              </View>

            </View>

          </View>

        </View>

        {/* ==================================================
            SERVICIOS
        ================================================== */}

        <View
          onLayout={(event) => {
            saveSectionPosition(
              'Servicios',
              event.nativeEvent.layout.y,
            );
          }}
          style={styles.anchorSection}
        >

          <View style={styles.sectionHeader}>

            <View style={styles.sectionLine} />

            <Text style={styles.sectionTitle}>
              Servicios
            </Text>

          </View>

          <Text style={styles.sectionDescription}>
            Todo lo que necesitas para disfrutar de
            tus eventos teatrales.
          </Text>

          <View style={styles.servicesGrid}>

            {services.map((service) => (

              <View
                key={service.title}
                style={styles.serviceCard}
              >

                <View style={styles.serviceIcon}>

                  <Ionicons
                    name={service.icon as any}
                    size={25}
                    color={colors.primary}
                  />

                </View>

                <Text style={styles.serviceTitle}>
                  {service.title}
                </Text>

                <Text style={styles.serviceDescription}>
                  {service.description}
                </Text>

              </View>

            ))}

          </View>

        </View>

        {/* ==================================================
            FUNCIONES
        ================================================== */}

        <View
          onLayout={(event) => {
            saveSectionPosition(
              'Funciones',
              event.nativeEvent.layout.y,
            );
          }}
          style={styles.anchorSection}
        >

          <View style={styles.sectionHeader}>

            <View style={styles.sectionLine} />

            <Text style={styles.sectionTitle}>
              Funciones
            </Text>

          </View>

          <Text style={styles.sectionDescription}>
            Estas son las funciones teatrales disponibles
            actualmente.
          </Text>

          {functions.map((func) => (

            <View
              key={`menu-function-${func.id}`}
              style={styles.functionLargeCard}
            >

              <View style={styles.largeFunctionIcon}>
                <Ionicons
                  name="easel-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <View style={styles.largeFunctionInfo}>

                <Text style={styles.largeFunctionTitle}>
                  Recuérdame, Día de Muertos
                </Text>

                <View style={styles.largeFunctionRow}>

                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.largeFunctionText}>
                    {func.day} {func.date}
                  </Text>

                </View>

                <View style={styles.largeFunctionRow}>

                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.largeFunctionText}>
                    {func.time}
                  </Text>

                </View>

                <View style={styles.largeFunctionRow}>

                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.largeFunctionText}>
                    {func.room}
                  </Text>

                </View>

                <View style={styles.largeFunctionRow}>

                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.largeFunctionText}>
                    Teatro Scala · Quito
                  </Text>

                </View>

                <Text style={styles.largeFunctionPrice}>
                  ${func.price.toFixed(2)}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.largeFunctionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() =>
                    handleBuyFunction(func)
                  }
                >

                  <Ionicons
                    name="ticket-outline"
                    size={18}
                    color={colors.text}
                  />

                  <Text style={styles.largeFunctionButtonText}>
                    Comprar entradas
                  </Text>

                </Pressable>

              </View>

            </View>

          ))}

        </View>

        {/* ==================================================
            NOTICIAS
        ================================================== */}

        <View
          onLayout={(event) => {
            saveSectionPosition(
              'Noticias',
              event.nativeEvent.layout.y,
            );
          }}
          style={styles.anchorSection}
        >

          <View style={styles.sectionHeader}>

            <View style={styles.sectionLine} />

            <Text style={styles.sectionTitle}>
              Noticias
            </Text>

          </View>

          <Text style={styles.sectionDescription}>
            Mantente informado sobre nuevas obras,
            funciones y eventos.
          </Text>

          {news.map((item) => (

            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.newsCard,
                pressed && styles.newsPressed,
              ]}
              onPress={() =>
                handleNews(
                  item.title,
                  item.description,
                )
              }
            >

              <View style={styles.newsIcon}>

                <Ionicons
                  name="newspaper-outline"
                  size={23}
                  color={colors.primary}
                />

              </View>

              <View style={styles.newsContent}>

                <Text style={styles.newsTitle}>
                  {item.title}
                </Text>

                <Text style={styles.newsDescription}>
                  {item.description}
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />

            </Pressable>

          ))}

        </View>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <View style={styles.footer}>

          <View style={styles.footerIcon}>

            <Ionicons
              name="easel-outline"
              size={28}
              color={colors.primary}
            />

          </View>

          <Text style={styles.footerTitle}>
            elteatroScala
          </Text>

          <Text style={styles.footerText}>
            Teatro, cultura y entretenimiento en Quito.
          </Text>

          <Text style={styles.footerLocation}>
            Quito · Ecuador
          </Text>

          <Text style={styles.footerBrand}>
            TICKETSAFE
          </Text>

        </View>

      </ScrollView>
    </View>
  );
}

/*
============================================================
COMPONENTE INFO ROW
============================================================
*/

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>

      <View style={styles.infoIcon}>

        <Ionicons
          name={icon as any}
          size={19}
          color={colors.primary}
        />

      </View>

      <View style={styles.infoRowContent}>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>

      </View>

    </View>
  );
}

/*
============================================================
ESTILOS
============================================================
*/

const styles = StyleSheet.create({

  /*
  ==========================================================
  BASE
  ==========================================================
  */

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingTop: 25,
    paddingBottom: 100,
  },

  /*
  ==========================================================
  HEADER
  ==========================================================
  */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  backButtonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  headerCenter: {
    flex: 1,
  },

  brand: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  theaterIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  /*
  ==========================================================
  MENÚ
  ==========================================================
  */

  menuContainer: {
    marginHorizontal: -18,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },

  menuContent: {
    paddingHorizontal: 12,
  },

  menuItem: {
    paddingHorizontal: 13,
    paddingVertical: 15,
    marginHorizontal: 2,
  },

  menuItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },

  menuText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  menuTextActive: {
    color: colors.primary,
  },

  /*
  ==========================================================
  SECCIONES
  ==========================================================
  */

  anchorSection: {
    marginTop: 8,
  },

  /*
  ==========================================================
  HERO
  ==========================================================
  */

  hero: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 15,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  heroGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.background,
    top: -120,
    right: -80,
    opacity: 0.8,
  },

  heroPoster: {
    minHeight: 270,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 18,
  },

  posterTitle: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },

  posterSubtitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
  },

  posterDivider: {
    width: 100,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 14,
  },

  posterDate: {
    color: colors.primary,
    fontSize: 45,
    fontWeight: '900',
  },

  posterMonth: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },

  posterMariachi: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 18,
    letterSpacing: 1,
  },

  posterBand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  heroInfo: {
    paddingHorizontal: 4,
  },

  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  ageText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  heroTitle: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 14,
  },

  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  heroDate: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },

  mainBuyButton: {
    marginTop: 15,
    backgroundColor: colors.primary,
    borderRadius: 13,
    minHeight: 50,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainBuyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 9,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  /*
  ==========================================================
  SECCIONES
  ==========================================================
  */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },

  sectionLine: {
    width: 5,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 10,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 15,
  },

  /*
  ==========================================================
  INFORMACIÓN
  ==========================================================
  */

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 17,
    marginBottom: 25,
  },

  infoDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  infoRows: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },

  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  infoRowContent: {
    flex: 1,
  },

  infoLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },

  infoValue: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /*
  ==========================================================
  FUNCIONES
  ==========================================================
  */

  functionCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },

  functionDate: {
    width: 55,
    height: 80,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  functionDay: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: '900',
  },

  functionNumber: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },

  functionMonth: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  functionInfo: {
    flex: 1,
  },

  functionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
  },

  functionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 5,
    flexShrink: 1,
  },

  functionPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 7,
  },

  buyFunctionButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    minWidth: 75,
  },

  buyFunctionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 3,
  },

  /*
  ==========================================================
  AVISO
  ==========================================================
  */

  warningCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 25,
    backgroundColor: colors.surface,
  },

  warningIcon: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  warningText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  /*
  ==========================================================
  FECHA
  ==========================================================
  */

  smallSection: {
    marginBottom: 25,
  },

  smallSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  calendarCard: {
    width: 65,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  calendarMonth: {
    textAlign: 'center',
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 9,
    fontWeight: '900',
    paddingVertical: 5,
  },

  calendarDay: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
    paddingVertical: 8,
  },

  calendarInfo: {
    flex: 1,
    marginLeft: 14,
  },

  calendarTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  calendarText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  /*
  ==========================================================
  SERVICIOS
  ==========================================================
  */

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  serviceCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    minHeight: 145,
    borderWidth: 1,
    borderColor: colors.background,
  },

  serviceIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  serviceTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  serviceDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  /*
  ==========================================================
  FUNCIONES DEL MENÚ
  ==========================================================
  */

  functionLargeCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.background,
  },

  largeFunctionIcon: {
    width: 62,
    height: 62,
    borderRadius: 15,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  largeFunctionInfo: {
    flex: 1,
  },

  largeFunctionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },

  largeFunctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  largeFunctionText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },

  largeFunctionPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 9,
  },

  largeFunctionButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  largeFunctionButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
  },

  /*
  ==========================================================
  NOTICIAS
  ==========================================================
  */

  newsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.background,
  },

  newsPressed: {
    opacity: 0.7,
  },

  newsIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  newsContent: {
    flex: 1,
  },

  newsTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  newsDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  /*
  ==========================================================
  FOOTER
  ==========================================================
  */

  footer: {
    alignItems: 'center',
    paddingTop: 35,
    paddingBottom: 25,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },

  footerIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  footerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  footerLocation: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  footerBrand: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 15,
  },
});
