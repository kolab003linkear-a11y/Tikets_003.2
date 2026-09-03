import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BusRoute, CatalogMovie, getBuses, getCatalog, getMatches, getParking, ParkingLot, StadiumMatch } from '../api/client';
import { colors, typography } from '../theme';
import AppState from '../components/AppState';
import ProfileAvatar from '../components/ProfileAvatar';
import { useModules } from '../modules/ModuleContext';

const categories = ['Todos', 'CINE', 'TEATRO', 'CONCIERTO'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { isEnabled } = useModules();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [matches, setMatches] = useState<StadiumMatch[]>([]);
  const [parking, setParking] = useState<ParkingLot[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [catalogResult, matchesResult, parkingResult, busesResult] = await Promise.allSettled([getCatalog(), getMatches(), getParking(), getBuses()]);
      if (catalogResult.status === 'fulfilled') setMovies(catalogResult.value.movies);
      if (matchesResult.status === 'fulfilled') setMatches(matchesResult.value.matches);
      if (parkingResult.status === 'fulfilled') setParking(parkingResult.value.parking);
      if (busesResult.status === 'fulfilled') setBusRoutes(busesResult.value.routes);
      if (catalogResult.status === 'rejected') throw catalogResult.reason;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la cartelera.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesCategory = category === 'Todos' || movie.category === category;
      const matchesSearch =
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        movie.synopsis.toLowerCase().includes(search.toLowerCase());
      const isInEmission = movie.status === 'NOW_SHOWING' || movie.showtimes.length > 0;
      return matchesCategory && matchesSearch && isInEmission;
    });
  }, [movies, search, category]);

  const upcomingMovies = useMemo(() => movies.filter((movie) => movie.status === 'COMING_SOON' && movie.showtimes.length === 0), [movies]);

  const formatShowtime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        data={!loading && !error ? filteredMovies : []}
        keyExtractor={(movie) => movie.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={4}
        windowSize={5}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Buenas tardes</Text>
            <Text style={styles.title}>Tu agenda cultural</Text>
          </View>
          <View style={styles.headerActions}>
            {isEnabled('assistant') && <Pressable accessibilityRole="button" accessibilityLabel="Abrir asistente" style={styles.iconButton} onPress={() => navigation.navigate('Assistant')}>
              <Ionicons name="sparkles-outline" size={21} color={colors.text} />
            </Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir notificaciones" accessibilityState={{ expanded: notificationsOpen }} style={styles.iconButton} onPress={() => setNotificationsOpen(true)}>
              <Ionicons name="notifications-outline" size={21} color={colors.text} />
              {notificationsOpen === false && <View style={styles.notificationDot} />}
            </Pressable>
                  <Modal visible={notificationsOpen} transparent animationType="fade" onRequestClose={() => setNotificationsOpen(false)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setNotificationsOpen(false)}>
                      <Pressable style={styles.notificationsPanel} onPress={(event) => event.stopPropagation()}>
                        <View style={styles.notificationsHeader}>
                          <View><Text style={styles.notificationsKicker}>CENTRO DE AVISOS</Text><Text style={styles.notificationsTitle}>Notificaciones</Text></View>
                          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar notificaciones" style={styles.closeButton} onPress={() => setNotificationsOpen(false)}><Ionicons name="close-outline" size={22} color={colors.text} /></Pressable>
                        </View>
                        <View style={styles.emptyNotifications}><Ionicons name="checkmark-circle-outline" size={34} color={colors.success} /><Text style={styles.emptyTitle}>Todo al día</Text><Text style={styles.emptyText}>No tienes notificaciones nuevas.</Text></View>
                      </Pressable>
                    </Pressable>
                  </Modal>
            <ProfileAvatar />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          <TextInput
            accessibilityLabel="Buscar evento o película"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Busca una experiencia"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.filters}>
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              accessibilityLabel={`Filtrar por ${item}`}
              style={[styles.chip, category === item && styles.chipSelected]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}><Text style={styles.heroTag}>RECOMENDADO</Text></View>
            <Text style={styles.heroTitle}>Una noche para recordar</Text>
            <Text style={styles.heroDescription}>Descubre cine, música y fútbol en un solo lugar.</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.kicker}>PARA TI</Text>
            <Text style={styles.sectionTitle}>Explora por experiencia</Text>
          </View>
          <Text style={styles.countLabel}>{movies.length} eventos</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <Pressable style={[styles.quickCard, styles.quickCardBlue]} onPress={() => setCategory('CINE')}>
            <Ionicons name="film-outline" size={24} color={colors.text} />
            <Text style={styles.quickTitle}>Cine</Text>
            <Text style={styles.quickMeta}>Historias en pantalla</Text>
          </Pressable>
          <Pressable style={[styles.quickCard, styles.quickCardCoral]} onPress={() => setCategory('TEATRO')}>
            <Ionicons name="sparkles-outline" size={24} color={colors.text} />
            <Text style={styles.quickTitle}>Teatro</Text>
            <Text style={styles.quickMeta}>Vive la escena</Text>
          </Pressable>
          {isEnabled('stadiums') && <Pressable style={[styles.quickCard, styles.quickCardGreen]} onPress={() => navigation.navigate('Estadios')}>
            <Ionicons name="football-outline" size={24} color={colors.text} />
            <Text style={styles.quickTitle}>Estadios</Text>
            <Text style={styles.quickMeta}>Siente el partido</Text>
          </Pressable>}
          {isEnabled('parking') && <Pressable style={[styles.quickCard, styles.quickCardCoral]} onPress={() => navigation.navigate('Parqueaderos')}>
            <Ionicons name="car-outline" size={24} color={colors.text} /><Text style={styles.quickTitle}>Parqueaderos</Text><Text style={styles.quickMeta}>{parking.length} disponibles</Text>
          </Pressable>}
          {isEnabled('buses') && <Pressable style={[styles.quickCard, styles.quickCardBlue]} onPress={() => navigation.navigate('Buses')}>
            <Ionicons name="bus-outline" size={24} color={colors.text} /><Text style={styles.quickTitle}>Buses</Text><Text style={styles.quickMeta}>{busRoutes.length} rutas activas</Text>
          </Pressable>}
        </ScrollView>

        {isEnabled('stadiums') && matches.length > 0 && (
          <>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.kicker}>EN VIVO PRÓXIMAMENTE</Text>
                <Text style={styles.sectionTitle}>Partidos destacados</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Estadios')}><Text style={styles.linkText}>Ver todos</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchRow}>
              {matches.slice(0, 4).map((match) => (
                <Pressable key={match.id} style={styles.matchCard} onPress={() => navigation.navigate('Estadios')}>
                  <Text style={styles.matchLeague}>{match.stadium.city.toUpperCase()} · {match.status === 'LIVE' ? 'EN VIVO' : 'PRÓXIMO'}</Text>
                  <Text style={styles.matchTeams}>{match.homeTeam.name}</Text>
                  <Text style={styles.matchVs}>VS</Text>
                  <Text style={styles.matchTeams}>{match.awayTeam.name}</Text>
                  <View style={styles.matchFooter}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.matchVenue}>{match.stadium.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {upcomingMovies.length > 0 && (
          <>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.kicker}>PROGRAMACIÓN OCHOYMEDIO</Text>
                <Text style={styles.sectionTitle}>Toda la programación</Text>
              </View>
              <Text style={styles.countLabel}>{upcomingMovies.length} títulos</Text>
            </View>
            <View style={styles.upcomingGrid}>
              {upcomingMovies.map((movie) => (
                <View key={movie.id} style={styles.upcomingCard}>
                  <Image source={{ uri: movie.posterUrl }} style={styles.upcomingImage} resizeMode="cover" />
                  <View style={styles.upcomingOverlay}><Text style={styles.upcomingTag}>PRÓXIMAMENTE</Text><Text style={styles.upcomingTitle}>{movie.title}</Text><Text style={styles.upcomingSynopsis} numberOfLines={3}>{movie.synopsis}</Text></View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.kicker}>SELECCIÓN DE HOY</Text>
            <Text style={styles.sectionTitle}>Cartelera disponible</Text>
          </View>
          <Text style={styles.countLabel}>{filteredMovies.length} resultados</Text>
        </View>

        {loading && (
          <AppState loading title="Cargando cartelera..." />
        )}

        {!loading && error && (
          <View style={styles.stateContainer}>
            <AppState title="No pudimos cargar los eventos" message={error} />
            <Pressable style={styles.retryButton} onPress={() => void loadCatalog()}>
              <Text style={styles.buyText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        </>}
        renderItem={({ item: movie }) => {
          const showtime = movie.showtimes[0];
          const price = Number(showtime?.price ?? 0);

          return (
          <View
            key={movie.id}
            style={styles.card}
          >
            <Image source={{ uri: movie.posterUrl }} style={styles.poster} resizeMode="cover" />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.rating}>★ {movie.rating ?? '-'}</Text>
              </View>
              <Text style={styles.meta}>{movie.category} • {movie.duration} min</Text>
              <Text style={styles.meta}>{showtime ? `${formatShowtime(showtime.startTime)} • ${showtime.room.name}` : 'Sin funciones disponibles'}</Text>
              <Text style={styles.synopsis}>{movie.synopsis}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>Desde ${price.toFixed(2)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reservar ${movie.title}`}
                  style={styles.buyButton}
                  disabled={!showtime}
                  onPress={() =>
                    navigation.navigate('SeatSelection', {
                      movieTitle: movie.title,
                      showtimeId: showtime.id,
                      startTime: showtime.startTime,
                      roomName: showtime.room.name,
                      price,
                      seatLayout: showtime.room.seatLayout,
                      occupiedSeats: showtime.occupiedSeats,
                    })
                  }
                >
                  <Text style={styles.buyText}>Reservar</Text>
                </Pressable>
              </View>
            </View>
          </View>
          );
        }}
        ListEmptyComponent={loading ? null : error ? null : <AppState title="No hay eventos para esta búsqueda" message="Prueba con otra categoría o término." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', fontFamily: typography.display },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  notificationDot: { position: 'absolute', top: 9, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.critical },
    modalBackdrop: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 76, paddingHorizontal: 16, backgroundColor: colors.overlay },
    notificationsPanel: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18 },
    notificationsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    notificationsKicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
    notificationsTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
    closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceRaised },
    emptyNotifications: { alignItems: 'center', paddingVertical: 28 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 10 },
    emptyText: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontWeight: '700' },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    paddingHorizontal: 0,
  },
  searchWrap: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.text },
  heroCard: { height: 205, borderRadius: 20, overflow: 'hidden', marginBottom: 24, backgroundColor: colors.surface },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 5 },
  heroTag: { color: colors.background, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 4, fontFamily: typography.display },
  heroDescription: { color: colors.text, fontSize: 13, marginTop: 6, width: '78%', lineHeight: 19 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '700' },
  countLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginBottom: 2 },
  quickActions: { gap: 10, paddingBottom: 25 },
  quickCard: { width: 145, height: 125, borderRadius: 16, padding: 15, justifyContent: 'space-between' },
  quickCardBlue: { backgroundColor: '#1769AA' },
  quickCardCoral: { backgroundColor: '#B9475C' },
  quickCardGreen: { backgroundColor: '#137A70' },
  quickTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  quickMeta: { color: 'rgba(248,250,252,0.75)', fontSize: 11 },
  matchRow: { gap: 10, paddingBottom: 26 },
  matchCard: { width: 215, minHeight: 145, borderRadius: 16, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, padding: 15 },
  matchLeague: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12 },
  matchTeams: { color: colors.text, fontSize: 15, fontWeight: '800' },
  matchVs: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginVertical: 2 },
  matchFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
  matchVenue: { color: colors.textSecondary, fontSize: 10, flex: 1 },
  upcomingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, paddingBottom: 26 },
  upcomingCard: { width: '48.5%', height: 190, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  upcomingImage: { width: '100%', height: '100%' },
  upcomingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 12, backgroundColor: 'rgba(10, 37, 64, 0.5)' },
  upcomingTag: { color: colors.warning, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  upcomingTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  upcomingSynopsis: { color: 'rgba(248,250,252,0.78)', fontSize: 11, lineHeight: 15, marginTop: 5 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  poster: { width: 112, height: 190 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movieTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700', marginRight: 8, fontFamily: typography.display },
  rating: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  synopsis: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  price: { color: colors.text, fontSize: 16, fontWeight: '800' },
  buyButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  buyText: { color: colors.text, fontWeight: '700' },
  stateContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
});
