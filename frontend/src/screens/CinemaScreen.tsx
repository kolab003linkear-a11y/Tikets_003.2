import React, { useMemo, useState } from 'react';

import {
  Alert,
  Modal,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCatalog } from '../api/client';

import { colors } from '../theme';

export default function CinemaScreen() {
  const navigation = useNavigation<any>();

  const posterImages: Record<string, string> = {
    Michael: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=85',
    Avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85',
    'Lilo & Stitch': 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&w=600&q=85',
    Superman: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?auto=format&fit=crop&w=600&q=85',
    'Cómo entrenar a tu dragón': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=85',
    'Una película de Minecraft': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=600&q=85',
    'Misión Imposible': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=85',
    'Jurassic World': 'https://images.unsplash.com/photo-1533470192397-8e7b7f1d8f6e?auto=format&fit=crop&w=600&q=85',
    'Avengers: Secret Wars': 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=600&q=85',
    'Toy Story 5': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=600&q=85',
    'Zootopia 2': 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?auto=format&fit=crop&w=600&q=85',
    'Avatar: Fuego y Ceniza': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85',
  };
  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=85';

  /* ======================================================
     ESTADOS
     ====================================================== */

  const [selectedCity, setSelectedCity] = useState('Quito');
  const [selectedComplex, setSelectedComplex] = useState('Scala');

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [complexModalVisible, setComplexModalVisible] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState<'cartelera' | 'comida'>('cartelera');

  const [movieSection, setMovieSection] =
    useState<'ahora' | 'proximamente'>('ahora');

  const [foodQuantities, setFoodQuantities] =
    useState<Record<string, number>>({});

  /* ======================================================
     CIUDADES
     ====================================================== */

  const cities = [
    'Ambato',
    'Cuenca',
    'Guayaquil',
    'Latacunga',
    'Machala',
    'Manta',
    'Quito',
    'Santo Domingo',
  ];

  /* ======================================================
     COMPLEJOS
     ====================================================== */

  const complexesByCity: Record<string, string[]> = {
    Quito: [
      'Scala',
      'Paseo San Francisco',
      'Pomasqui',
      'El Portal',
      'Quicentro Norte',
      'CCI',
      'Plaza Americas',
      'Condado',
      'Recreo',
    ],

    Guayaquil: [
      'Mall del Sol',
      'CityMall',
      'San Marino',
      'Riocentro Ceibos',
      'Riocentro Norte',
    ],

    Cuenca: [
      'Mall del Río',
      'El Vergel',
      'Gran Akí',
    ],

    Ambato: [
      'Mall de los Andes',
      'Multiplaza Ambato',
    ],

    Latacunga: [
      'Maltería Plaza',
    ],

    Machala: [
      'Paseo Shopping Machala',
    ],

    Manta: [
      'Mall del Pacífico',
    ],

    'Santo Domingo': [
      'Paseo Shopping Santo Domingo',
    ],
  };

  const availableComplexes =
    complexesByCity[selectedCity] || [];

  /* ======================================================
     PELÍCULAS
     ====================================================== */

  const movies = [
    {
      id: 'cinema-michael',
      title: 'Michael',
      genre: 'Drama / Biografía',
      duration: '2h 10min',
      age: '+12',
      price: 12,
    },
    {
      id: 'cinema-avatar',
      title: 'Avatar',
      genre: 'Ciencia ficción',
      duration: '2h 35min',
      age: '+12',
      price: 10,
    },
    {
      id: 'cinema-lilo',
      title: 'Lilo & Stitch',
      genre: 'Aventura / Familiar',
      duration: '1h 48min',
      age: 'Todo público',
      price: 9,
    },
    {
      id: 'cinema-superman',
      title: 'Superman',
      genre: 'Acción / Aventura',
      duration: '2h 09min',
      age: '+12',
      price: 11,
    },
    {
      id: 'cinema-dragon',
      title: 'Cómo entrenar a tu dragón',
      genre: 'Aventura / Fantasía',
      duration: '2h 05min',
      age: 'Todo público',
      price: 10,
    },
    {
      id: 'cinema-minecraft',
      title: 'Una película de Minecraft',
      genre: 'Aventura / Comedia',
      duration: '1h 41min',
      age: 'Todo público',
      price: 9,
    },
    {
      id: 'cinema-mission',
      title: 'Misión Imposible',
      genre: 'Acción / Suspenso',
      duration: '2h 49min',
      age: '+12',
      price: 12,
    },
    {
      id: 'cinema-jurassic',
      title: 'Jurassic World',
      genre: 'Aventura / Ciencia ficción',
      duration: '2h 13min',
      age: '+12',
      price: 11,
    },
  ];

  /* ======================================================
     PRÓXIMAMENTE
     ====================================================== */

  const upcomingMovies = [
    {
      id: 'upcoming-avengers',
      title: 'Avengers: Secret Wars',
      genre: 'Acción / Fantasía',
      duration: 'Próximamente',
      age: '+12',
      price: 12,
    },
    {
      id: 'upcoming-toy',
      title: 'Toy Story 5',
      genre: 'Animación / Familiar',
      duration: 'Próximamente',
      age: 'Todo público',
      price: 10,
    },
    {
      id: 'upcoming-zootopia',
      title: 'Zootopia 2',
      genre: 'Animación / Comedia',
      duration: 'Próximamente',
      age: 'Todo público',
      price: 10,
    },
    {
      id: 'upcoming-avatar',
      title: 'Avatar: Fuego y Ceniza',
      genre: 'Ciencia ficción',
      duration: 'Próximamente',
      age: '+12',
      price: 12,
    },
    {
      id: 'upcoming-spiderman',
      title: 'Spider-Man',
      genre: 'Acción / Aventura',
      duration: 'Próximamente',
      age: '+12',
      price: 11,
    },
  ];

  /* ======================================================
     COMIDA
     ====================================================== */

  const foodProducts = [
    {
      id: 'food-popcorn',
      name: 'Canguil',
      description: 'Canguil grande',
      price: 3.5,
      icon: '🍿',
    },
    {
      id: 'food-combo',
      name: 'Combo CineFan',
      description: 'Canguil + bebida',
      price: 3.75,
      icon: '🥤',
    },
    {
      id: 'food-hotdog',
      name: 'Perro caliente',
      description: 'Hot dog clásico',
      price: 2.99,
      icon: '🌭',
    },
    {
      id: 'food-nachos',
      name: 'Nachos',
      description: 'Nachos con queso',
      price: 2.99,
      icon: '🧀',
    },
    {
      id: 'food-jolly',
      name: 'Jolly Rancher',
      description: 'Bebida refrescante',
      price: 1.99,
      icon: '🥤',
    },
    {
      id: 'food-burger',
      name: 'Hamburguesa',
      description: 'Hamburguesa clásica',
      price: 5.5,
      icon: '🍔',
    },
    {
      id: 'food-pizza',
      name: 'Pizza',
      description: 'Porción de pizza',
      price: 4.5,
      icon: '🍕',
    },
    {
      id: 'food-icecream',
      name: 'Helado',
      description: 'Helado CineFan',
      price: 2.5,
      icon: '🍦',
    },
    {
      id: 'food-candy',
      name: 'Dulces',
      description: 'Dulces variados',
      price: 2.0,
      icon: '🍫',
    },
    {
      id: 'food-drink',
      name: 'Bebida',
      description: 'Gaseosa grande',
      price: 2.25,
      icon: '🥤',
    },
  ];

  /* ======================================================
     PELÍCULAS MOSTRADAS
     ====================================================== */

  const displayedMovies =
    movieSection === 'ahora'
      ? movies
      : upcomingMovies;

  /* ======================================================
     TOTAL COMIDA
     ====================================================== */

  const foodTotal = useMemo(() => {
    return foodProducts.reduce((total, product) => {
      const quantity =
        foodQuantities[product.id] || 0;

      return total + product.price * quantity;
    }, 0);
  }, [foodQuantities]);

  const totalFoodItems = useMemo(() => {
    return Object.values(foodQuantities).reduce(
      (total, quantity) => total + quantity,
      0
    );
  }, [foodQuantities]);

  /* ======================================================
     SELECCIONAR PELÍCULA
     ====================================================== */

  const handleMovie = async (movie: any) => {
    try {
      const catalog = await getCatalog();
      const catalogMovie = catalog.movies.find((item) => item.title.toLowerCase() === movie.title.toLowerCase());
      const selectedMovie = catalogMovie?.showtimes.length ? catalogMovie : catalog.movies.find((item) => item.showtimes.length > 0);
      const showtime = selectedMovie?.showtimes[0];

      if (!selectedMovie || !showtime) {
        Alert.alert('Función no disponible', 'No encontramos horarios disponibles para esta película.');
        return;
      }

      navigation.navigate('SeatSelection', {
      type: 'cinema',

      movieTitle: selectedMovie.title,
      movie,

      showtimeId: showtime.id,

      price: Number(showtime.price),
      startTime: showtime.startTime,
      roomName: showtime.room.name,

      city: selectedCity,
      venue: selectedComplex,

      seatLayout: showtime.room.seatLayout,
      occupiedSeats: showtime.occupiedSeats,
      });
    } catch (error) {
      Alert.alert('No se pudo cargar la función', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    }
  };

  /* ======================================================
     AGREGAR COMIDA
     ====================================================== */

  const addFood = (foodId: string) => {
    setFoodQuantities((current) => ({
      ...current,
      [foodId]: (current[foodId] || 0) + 1,
    }));
  };

  /* ======================================================
     QUITAR COMIDA
     ====================================================== */

  const removeFood = (foodId: string) => {
    setFoodQuantities((current) => {
      const quantity = current[foodId] || 0;

      if (quantity <= 1) {
        const updated = { ...current };
        delete updated[foodId];
        return updated;
      }

      return {
        ...current,
        [foodId]: quantity - 1,
      };
    });
  };

  /* ======================================================
     PAGAR COMIDA
     ====================================================== */

  const handlePayFood = () => {
    if (foodTotal <= 0) {
      Alert.alert(
        'Sin productos',
        'Agrega comida antes de continuar al pago.'
      );
      return;
    }

    const selectedProducts = foodProducts
      .filter(
        (product) =>
          (foodQuantities[product.id] || 0) > 0
      )
      .map((product) => ({
        ...product,
        quantity: foodQuantities[product.id],
      }));

    navigation.navigate('Checkout', {
      type: 'food',
      city: selectedCity,
      venue: selectedComplex,
      items: selectedProducts,
      total: foodTotal,
    });
  };

  /* ======================================================
     REGRESAR
     ====================================================== */

  const handleBack = () => {
    navigation.goBack();
  };

  /* ======================================================
     CAMBIAR CIUDAD
     ====================================================== */

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);

    const newComplexes =
      complexesByCity[city] || [];

    if (
      newComplexes.length > 0 &&
      !newComplexes.includes(selectedComplex)
    ) {
      setSelectedComplex(newComplexes[0]);
    }

    setCityModalVisible(false);
  };

  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* ==================================================
            ENCABEZADO
            ================================================== */}

        <View style={styles.header}>

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerInfo}>

            <Text style={styles.smallTitle}>
              TICKETSAFE
            </Text>

            <Text style={styles.title}>
              Cine
            </Text>

            <Text style={styles.subtitle}>
              Disfruta las mejores películas
            </Text>

          </View>

          <View style={styles.iconContainer}>

            <Ionicons
              name="film-outline"
              size={28}
              color={colors.primary}
            />

          </View>

        </View>


        {/* ==================================================
            CIUDAD
            ================================================== */}

        <Text style={styles.complexLabel}>
          Ciudad
        </Text>

        <Pressable
          style={styles.citySelector}
          onPress={() =>
            setCityModalVisible(true)
          }
        >

          <View style={styles.selectorLeft}>

            <Ionicons
              name="location-outline"
              size={20}
              color={colors.primary}
            />

            <View>

              <Text style={styles.complexSmall}>
                Selecciona la ciudad
              </Text>

              <Text style={styles.complexName}>
                {selectedCity}
              </Text>

            </View>

          </View>

          <Ionicons
            name="chevron-down"
            size={20}
            color="#FFFFFF"
          />

        </Pressable>


        {/* ==================================================
            COMPLEJO
            ================================================== */}

        <Text style={styles.complexLabel}>
          Complejo
        </Text>

        <Pressable
          style={styles.complexSelector}
          onPress={() =>
            setComplexModalVisible(true)
          }
        >

          <View style={styles.selectorLeft}>

            <View style={styles.complexIcon}>

              <Ionicons
                name="business-outline"
                size={22}
                color={colors.primary}
              />

            </View>

            <View>

              <Text style={styles.complexSmall}>
                Selecciona el complejo
              </Text>

              <Text style={styles.complexName}>
                {selectedComplex}
              </Text>

            </View>

          </View>

          <Ionicons
            name="chevron-down"
            size={22}
            color="#FFFFFF"
          />

        </Pressable>


        {/* ==================================================
            BANNER
            ================================================== */}

        <View style={styles.banner}>

          <View style={styles.bannerText}>

            <Text style={styles.bannerSmall}>
              EXCLUSIVO CINEFAN
            </Text>

            <Text style={styles.bannerTitle}>
              UN ABUELO
            </Text>

            <Text style={styles.bannerTitle}>
              TODO
            </Text>

            <Text style={styles.bannerSubtitle}>
              Combos y promociones especiales
            </Text>

          </View>

          <View style={styles.bannerIcon}>

            <Text style={styles.bannerEmoji}>
              🍿
            </Text>

          </View>

          <View style={styles.bannerPrice}>

            <Text style={styles.fromText}>
              DESDE
            </Text>

            <Text style={styles.priceBig}>
              3,75 $
            </Text>

          </View>

        </View>


        {/* ==================================================
            BOTONES PRINCIPALES
            ================================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.mainTabsContent
          }
        >

          <Pressable
            style={[
              styles.mainTab,
              activeSection === 'cartelera' &&
                styles.mainTabActive,
            ]}
            onPress={() =>
              setActiveSection('cartelera')
            }
          >

            <Ionicons
              name="film-outline"
              size={21}
              color={
                activeSection === 'cartelera'
                  ? '#FFFFFF'
                  : colors.primary
              }
            />

            <Text
              style={[
                styles.mainTabText,
                activeSection === 'cartelera' &&
                  styles.mainTabTextActive,
              ]}
            >
              Cartelera
            </Text>

          </Pressable>


          <Pressable
            style={[
              styles.mainTab,
              activeSection === 'comida' &&
                styles.mainTabActive,
            ]}
            onPress={() =>
              setActiveSection('comida')
            }
          >

            <Ionicons
              name="fast-food-outline"
              size={21}
              color={
                activeSection === 'comida'
                  ? '#FFFFFF'
                  : colors.primary
              }
            />

            <Text
              style={[
                styles.mainTabText,
                activeSection === 'comida' &&
                  styles.mainTabTextActive,
              ]}
            >
              Comida
            </Text>

          </Pressable>

        </ScrollView>


        {/* ==================================================
            CARTELERA
            ================================================== */}

        {activeSection === 'cartelera' && (
          <View>

            <View style={styles.sectionHeader}>

              <Text style={styles.sectionTitle}>
                Cartelera
              </Text>

            </View>


            {/* AHORA / PRÓXIMAMENTE */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.movieTabsContent
              }
            >

              <Pressable
                style={[
                  styles.movieTab,
                  movieSection === 'ahora' &&
                    styles.movieTabActive,
                ]}
                onPress={() =>
                  setMovieSection('ahora')
                }
              >

                <Text
                  style={[
                    styles.movieTabText,
                    movieSection === 'ahora' &&
                      styles.movieTabTextActive,
                  ]}
                >
                  Ahora
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.movieTab,
                  movieSection ===
                    'proximamente' &&
                    styles.movieTabActive,
                ]}
                onPress={() =>
                  setMovieSection(
                    'proximamente'
                  )
                }
              >

                <Text
                  style={[
                    styles.movieTabText,
                    movieSection ===
                      'proximamente' &&
                      styles.movieTabTextActive,
                  ]}
                >
                  Próximamente
                </Text>

              </Pressable>

            </ScrollView>


            {/* PELÍCULAS */}

            {displayedMovies.map((movie) => (

              <View
                key={movie.id}
                style={styles.movieCard}
              >

                <View style={styles.poster}>
                  <Image
                    source={{ uri: posterImages[movie.title] ?? fallbackPoster }}
                    style={styles.posterImage}
                    resizeMode="cover"
                  />
                  <View style={styles.posterOverlay} />
                  <Text style={styles.posterText}>{movie.title}</Text>
                </View>


                <View style={styles.movieInfo}>

                  <Text style={styles.movieTitle}>
                    {movie.title}
                  </Text>

                  <Text style={styles.movieGenre}>
                    {movie.genre}
                  </Text>

                  <View style={styles.details}>

                    <Text style={styles.detailText}>
                      {movie.duration}
                    </Text>

                    <Text style={styles.detailText}>
                      {movie.age}
                    </Text>

                  </View>

                  <Text style={styles.price}>
                    Desde $
                    {movie.price.toFixed(2)}
                  </Text>

                  {movieSection ===
                    'ahora' ? (
                    <Pressable
                      style={styles.button}
                      onPress={() => void handleMovie(movie)}
                    >

                      <Text
                        style={styles.buttonText}
                      >
                        Ver funciones
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />

                    </Pressable>
                  ) : (
                    <View
                      style={
                        styles.comingSoonButton
                      }
                    >

                      <Ionicons
                        name="time-outline"
                        size={17}
                        color={colors.primary}
                      />

                      <Text
                        style={
                          styles.comingSoonText
                        }
                      >
                        Próximamente
                      </Text>

                    </View>
                  )}

                </View>

              </View>

            ))}

          </View>
        )}


        {/* ==================================================
            COMIDA
            ================================================== */}

        {activeSection === 'comida' && (
          <View>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>
                  Comida
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  Elige tus productos favoritos
                </Text>

              </View>

              {totalFoodItems > 0 && (
                <View
                  style={styles.cartBadge}
                >

                  <Ionicons
                    name="cart-outline"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={styles.cartBadgeText}
                  >
                    {totalFoodItems}
                  </Text>

                </View>
              )}

            </View>


            {/* PRODUCTOS */}

            {foodProducts.map((food) => {

              const quantity =
                foodQuantities[food.id] || 0;

              return (
                <View
                  key={food.id}
                  style={styles.foodCard}
                >

                  <View
                    style={styles.foodIcon}
                  >
                    <Text
                      style={styles.foodEmoji}
                    >
                      {food.icon}
                    </Text>
                  </View>


                  <View
                    style={styles.foodInfo}
                  >

                    <Text
                      style={styles.foodName}
                    >
                      {food.name}
                    </Text>

                    <Text
                      style={
                        styles.foodDescription
                      }
                    >
                      {food.description}
                    </Text>

                    <Text
                      style={styles.foodPrice}
                    >
                      ${food.price.toFixed(2)}
                    </Text>

                  </View>


                  <View
                    style={styles.quantityContainer}
                  >

                    <Pressable
                      style={[
                        styles.quantityButton,
                        quantity === 0 &&
                          styles.quantityButtonDisabled,
                      ]}
                      disabled={quantity === 0}
                      onPress={() =>
                        removeFood(food.id)
                      }
                    >

                      <Ionicons
                        name="remove"
                        size={19}
                        color={
                          quantity === 0
                            ? '#64748B'
                            : '#FFFFFF'
                        }
                      />

                    </Pressable>


                    <Text
                      style={
                        styles.quantityText
                      }
                    >
                      {quantity}
                    </Text>


                    <Pressable
                      style={
                        styles.quantityButton
                      }
                      onPress={() =>
                        addFood(food.id)
                      }
                    >

                      <Ionicons
                        name="add"
                        size={19}
                        color="#FFFFFF"
                      />

                    </Pressable>

                  </View>

                </View>
              );
            })}


            {/* RESUMEN */}

            {foodTotal > 0 && (
              <View
                style={styles.foodSummary}
              >

                <View>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Total de comida
                  </Text>

                  <Text
                    style={
                      styles.summaryItems
                    }
                  >
                    {totalFoodItems}{' '}
                    producto
                    {totalFoodItems !== 1
                      ? 's'
                      : ''}
                  </Text>

                </View>


                <Text
                  style={styles.summaryTotal}
                >
                  ${foodTotal.toFixed(2)}
                </Text>

              </View>
            )}


            {/* PAGAR */}

            <Pressable
              style={[
                styles.payFoodButton,
                foodTotal === 0 &&
                  styles.payFoodButtonDisabled,
              ]}
              disabled={foodTotal === 0}
              onPress={handlePayFood}
            >

              <Ionicons
                name="card-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.payFoodButtonText
                }
              >
                Pagar comida
              </Text>

              {foodTotal > 0 && (
                <Text
                  style={
                    styles.payFoodAmount
                  }
                >
                  ${foodTotal.toFixed(2)}
                </Text>
              )}

            </Pressable>

          </View>
        )}

      </ScrollView>


      {/* ==================================================
          MODAL CIUDAD
          ================================================== */}

      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCityModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.cityModal}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Selecciona la ciudad
              </Text>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setCityModalVisible(false)
                }
              >

                <Ionicons
                  name="close"
                  size={24}
                  color="#FFFFFF"
                />

              </Pressable>

            </View>


            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalList
              }
            >

              {cities.map((city) => {

                const selected =
                  city === selectedCity;

                return (
                  <Pressable
                    key={city}
                    style={[
                      styles.option,
                      selected &&
                        styles.optionSelected,
                    ]}
                    onPress={() =>
                      handleCitySelect(city)
                    }
                  >

                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {city}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}

                  </Pressable>
                );
              })}

            </ScrollView>

          </View>

        </View>

      </Modal>


      {/* ==================================================
          MODAL COMPLEJO
          ================================================== */}

      <Modal
        visible={complexModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setComplexModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.complexModal}>

            <View style={styles.modalHeader}>

              <View>

                <Text
                  style={styles.modalTitle}
                >
                  Selecciona el complejo
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  {selectedCity}
                </Text>

              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setComplexModalVisible(false)
                }
              >

                <Ionicons
                  name="close"
                  size={24}
                  color="#FFFFFF"
                />

              </Pressable>

            </View>


            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalList
              }
            >

              {availableComplexes.map(
                (complex) => {

                  const selected =
                    complex ===
                    selectedComplex;

                  return (
                    <Pressable
                      key={complex}
                      style={[
                        styles.option,
                        selected &&
                          styles.optionSelected,
                      ]}
                      onPress={() => {
                        setSelectedComplex(
                          complex
                        );

                        setComplexModalVisible(
                          false
                        );
                      }}
                    >

                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {complex}
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={
                            colors.primary
                          }
                        />
                      )}

                    </Pressable>
                  );
                }
              )}

            </ScrollView>


            <Pressable
              style={styles.confirmButton}
              onPress={() =>
                setComplexModalVisible(false)
              }
            >

              <Text
                style={
                  styles.confirmButtonText
                }
              >
                Confirmar
              </Text>

            </Pressable>

          </View>

        </View>

      </Modal>

    </View>
  );
}


/* ========================================================
   ESTILOS
   ======================================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 15,
    paddingTop: 28,
    paddingBottom: 100,
  },


  /* ======================================================
     HEADER
     ====================================================== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
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

  headerInfo: {
    flex: 1,
  },

  smallTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 3,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,

    justifyContent: 'center',
    alignItems: 'center',
  },


  /* ======================================================
     COMPLEJO
     ====================================================== */

  complexLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 3,
  },

  citySelector: {
    backgroundColor: '#10385D',
    borderRadius: 16,
    padding: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 10,
  },

  complexSelector: {
    backgroundColor: '#10385D',
    borderRadius: 16,
    padding: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 16,
  },

  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  complexIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#082D4D',

    justifyContent: 'center',
    alignItems: 'center',
  },

  complexInfo: {
    flex: 1,
  },

  complexSmall: {
    color: colors.textSecondary,
    fontSize: 9,
  },

  complexName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },


  /* ======================================================
     BANNER
     ====================================================== */

  banner: {
    backgroundColor: '#FFD21C',
    borderRadius: 20,

    minHeight: 112,

    paddingHorizontal: 14,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 18,
  },

  bannerText: {
    flex: 1,
  },

  bannerSmall: {
    color: '#111111',
    fontSize: 7,
    fontWeight: '900',
  },

  bannerTitle: {
    color: '#F2298F',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 19,
  },

  bannerSubtitle: {
    color: '#111111',
    fontSize: 8,
    marginTop: 4,
    fontWeight: '700',
  },

  bannerIcon: {
    width: 62,
    height: 62,
    borderRadius: 15,

    backgroundColor: '#F23891',

    justifyContent: 'center',
    alignItems: 'center',
  },

  bannerEmoji: {
    fontSize: 34,
  },

  bannerPrice: {
    width: 92,
    alignItems: 'center',
  },

  fromText: {
    color: '#111111',
    fontSize: 8,
    fontWeight: '800',
  },

  priceBig: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },


  /* ======================================================
     BOTONES CARTELERA / COMIDA
     ====================================================== */

  mainTabsContent: {
    gap: 10,
    paddingBottom: 18,
  },

  mainTab: {
    minWidth: 125,
    height: 54,

    borderRadius: 15,

    backgroundColor: colors.surface,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 18,
    gap: 8,
  },

  mainTabActive: {
    backgroundColor: colors.primary,
  },

  mainTabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },

  mainTabTextActive: {
    color: '#FFFFFF',
  },


  /* ======================================================
     SECCIONES
     ====================================================== */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 12,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },


  /* ======================================================
     AHORA / PRÓXIMAMENTE
     ====================================================== */

  movieTabsContent: {
    gap: 8,
    paddingBottom: 15,
  },

  movieTab: {
    paddingHorizontal: 20,
    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor: colors.surface,
  },

  movieTabActive: {
    backgroundColor: colors.primary,
  },

  movieTabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },

  movieTabTextActive: {
    color: '#FFFFFF',
  },


  /* ======================================================
     PELÍCULAS
     ====================================================== */

  movieCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,

    padding: 14,
    marginBottom: 14,

    flexDirection: 'row',
  },

  poster: {
    width: 100,
    height: 145,

    borderRadius: 14,

    backgroundColor: colors.background,

    justifyContent: 'center',
    alignItems: 'center',

    padding: 8,
  },

  posterImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: undefined,
    height: undefined,
    borderRadius: 14,
  },

  posterOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 13, 24, 0.28)',
  },

  posterText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  movieInfo: {
    flex: 1,
    marginLeft: 14,
  },

  movieTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  movieGenre: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 9,
  },

  detailText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 9,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,

    paddingVertical: 10,
    paddingHorizontal: 10,

    marginTop: 9,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  comingSoonButton: {
    borderWidth: 1,
    borderColor: colors.primary,

    borderRadius: 12,

    paddingVertical: 9,

    marginTop: 9,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 5,
  },

  comingSoonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },


  /* ======================================================
     COMIDA
     ====================================================== */

  cartBadge: {
    backgroundColor: colors.primary,

    minWidth: 38,
    height: 32,

    borderRadius: 15,

    paddingHorizontal: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  foodCard: {
    backgroundColor: colors.surface,

    borderRadius: 18,

    padding: 12,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',
  },

  foodIcon: {
    width: 62,
    height: 62,

    borderRadius: 15,

    backgroundColor: colors.background,

    justifyContent: 'center',
    alignItems: 'center',
  },

  foodEmoji: {
    fontSize: 32,
  },

  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },

  foodName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  foodDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  foodPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  quantityButton: {
    width: 32,
    height: 32,

    borderRadius: 10,

    backgroundColor: colors.primary,

    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityButtonDisabled: {
    backgroundColor: '#263342',
  },

  quantityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',

    minWidth: 18,
    textAlign: 'center',
  },

  foodSummary: {
    backgroundColor: colors.surface,

    borderRadius: 18,

    padding: 17,

    marginTop: 8,
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  summaryItems: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  summaryTotal: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },

  payFoodButton: {
    backgroundColor: colors.primary,

    height: 52,

    borderRadius: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    marginBottom: 20,
  },

  payFoodButtonDisabled: {
    backgroundColor: colors.surfaceRaised,
  },

  payFoodButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  payFoodAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 4,
  },


  /* ======================================================
     MODALES
     ====================================================== */

  modalOverlay: {
    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.72)',

    justifyContent: 'center',
    alignItems: 'center',

    padding: 14,
  },

  cityModal: {
    width: '100%',
    maxHeight: '78%',

    backgroundColor: '#171A20',

    borderRadius: 18,

    padding: 15,
  },

  complexModal: {
    width: '100%',
    maxHeight: '82%',

    backgroundColor: '#171A20',

    borderRadius: 18,

    padding: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 12,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  modalList: {
    paddingBottom: 8,
  },

  option: {
    minHeight: 46,

    borderRadius: 12,

    paddingHorizontal: 14,

    marginBottom: 7,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  optionSelected: {
    backgroundColor: '#2A2F3D',
  },

  optionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  optionTextSelected: {
    fontWeight: '900',
  },

  confirmButton: {
    height: 46,

    borderRadius: 12,

    backgroundColor: '#FFB51B',

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 5,
  },

  confirmButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

});