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
import { colors, radii, shadows, typography } from '../theme';
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
  const [recommendedIndex, setRecommendedIndex] = useState(0);
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
      const isAvailable = movie.status !== 'COMING_SOON' || movie.showtimes.length > 0;
      return matchesCategory && matchesSearch && isAvailable;
    });
  }, [movies, search, category]);

  const recommendedMovies = useMemo(
    () => movies.filter((movie) => movie.status !== 'COMING_SOON' || movie.showtimes.length > 0).concat(
      movies.filter((movie) => movie.status === 'COMING_SOON' && movie.showtimes.length === 0),
    ),
    [movies],
  );

  const recommendedMovie = recommendedMovies[recommendedIndex % Math.max(recommendedMovies.length, 1)];

  const upcomingMovies = useMemo(
    () => movies.filter((movie) => movie.status === 'COMING_SOON' || movie.category === 'CONCIERTO' || movie.category === 'TEATRO').slice(0, 8),
    [movies],
  );

  const upcomingMatches = useMemo(
    () => matches.filter((match) => match.status === 'SCHEDULED').slice(0, 4),
    [matches],
  );

  const formatShowtime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const notifications = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; tag: string; tone: 'info' | 'success' | 'warning' }> = [];

    movies.slice(0, 2).forEach((movie) => {
      const showtime = movie.showtimes[0];
      if (showtime) {
        items.push({
          id: `movie-${movie.id}`,
          title: `${movie.title}`,
          subtitle: `${formatShowtime(showtime.startTime)} • ${showtime.room.name}`,
          tag: 'Recordatorio',
          tone: 'info',
        });
      }
    });

    matches.slice(0, 2).forEach((match) => {
      items.push({
        id: `match-${match.id}`,
        title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        subtitle: `${match.stadium.name} • ${formatShowtime(match.startTime)}`,
        tag: 'Partido',
        tone: 'warning',
      });
    });

    if (items.length === 0) {
      items.push({
        id: 'default',
        title: 'Todo listo para explorar',
        subtitle: 'Descubre nuevas experiencias y guarda tus favoritos para recordatorios.',
        tag: 'Novedad',
        tone: 'success',
      });
    }

    return items.slice(0, 4);
  }, [movies, matches]);

  useEffect(() => {
    if (recommendedMovies.length < 2) return;
    const rotation = setInterval(() => {
      setRecommendedIndex((current) => (current + 1) % recommendedMovies.length);
    }, 5000);
    return () => clearInterval(rotation);
  }, [recommendedMovies.length]);

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

                        <View style={styles.notificationsList}>
                          {notifications.map((item) => (
                            <View key={item.id} style={styles.notificationItem}>
                              <View style={[styles.notificationBadge, item.tone === 'success' ? styles.notificationBadgeSuccess : item.tone === 'warning' ? styles.notificationBadgeWarning : styles.notificationBadgeInfo]}>
                                <Text style={styles.notificationBadgeText}>{item.tag}</Text>
                              </View>
                              <View style={styles.notificationCopy}>
                                <Text style={styles.notificationTitle}>{item.title}</Text>
                                <Text style={styles.notificationText}>{item.subtitle}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
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

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.kicker}>ACCESOS RÁPIDOS</Text>
            <Text style={styles.sectionTitle}>Explora por experiencia</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {[
            { key: 'cine', label: 'Cine', detail: 'Películas y funciones', icon: 'film-outline' as const, tone: styles.quickCardBlue, action: () => navigation.navigate('Cine') },
            { key: 'concerts', label: 'Conciertos', detail: 'Música en vivo', icon: 'musical-notes-outline' as const, tone: styles.quickCardCoral, action: () => navigation.navigate('Conciertos') },
            { key: 'theater', label: 'Teatro', detail: 'Obras y espectáculos', icon: 'easel-outline' as const, tone: styles.quickCardGreen, action: () => navigation.navigate('Teatro') },
            { key: 'matches', label: 'Partidos', detail: 'Estadios y localidades', icon: 'football-outline' as const, tone: styles.quickCardGold, action: () => navigation.navigate('EstadiosModulo') },
            { key: 'parking', label: 'Parqueaderos', detail: 'Reserva tu plaza', icon: 'car-outline' as const, tone: styles.quickCardNavy, action: () => navigation.navigate('ParqueaderosModulo') },
          ].map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.label}`}
              style={({ pressed }) => [styles.quickCard, item.tone, pressed && styles.quickCardPressed]}
              onPress={item.action}
            >
              <Ionicons name={item.icon} size={25} color={colors.text} />
              <View>
                <Text style={styles.quickTitle}>{item.label}</Text>
                <Text style={styles.quickMeta}>{item.detail}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {(upcomingMovies.length > 0 || upcomingMatches.length > 0) && <>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.kicker}>AGENDA</Text>
              <Text style={styles.sectionTitle}>Próximamente</Text>
            </View>
            <Text style={styles.countLabel}>{upcomingMovies.length + upcomingMatches.length} opciones</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingStrip}>
            {upcomingMatches.map((match) => (
              <Pressable key={match.id} style={[styles.upcomingTile, styles.upcomingMatchTile]} onPress={() => navigation.navigate('EstadiosModulo')}>
                <Ionicons name="football-outline" size={24} color={colors.warning} />
                <Text style={styles.upcomingTileTag}>PARTIDO PRÓXIMO</Text>
                <Text style={styles.upcomingTileTitle}>{match.homeTeam.name} vs {match.awayTeam.name}</Text>
                <Text style={styles.upcomingTileMeta}>{match.stadium.name}</Text>
              </Pressable>
            ))}
            {upcomingMovies.map((movie) => (
              <Pressable key={movie.id} style={styles.upcomingTile} onPress={() => setCategory(movie.category)}>
                <Image source={{ uri: movie.posterUrl }} style={styles.upcomingTileImage} />
                <View style={styles.upcomingTileOverlay}>
                  <Text style={styles.upcomingTileTag}>{movie.category === 'CONCIERTO' ? 'CONCIERTO' : movie.category === 'TEATRO' ? 'OBRA DE TEATRO' : 'PELÍCULA'}</Text>
                  <Text style={styles.upcomingTileTitle}>{movie.title}</Text>
                  <Text style={styles.upcomingTileMeta}>Ver más experiencias</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recommendedMovie ? `Abrir recomendado: ${recommendedMovie.title}` : 'Recomendación'}
          style={styles.heroCard}
          disabled={!recommendedMovie}
          onPress={() => {
            if (!recommendedMovie) return;
            const showtime = recommendedMovie.showtimes[0];
            if (showtime) {
              navigation.navigate('SeatSelection', {
                movieTitle: recommendedMovie.title,
                showtimeId: showtime.id,
                startTime: showtime.startTime,
                roomName: showtime.room.name,
                price: Number(showtime.price),
                seatLayout: showtime.room.seatLayout,
                occupiedSeats: showtime.occupiedSeats,
              });
            } else {
              setCategory(recommendedMovie.category);
            }
          }}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}><Text style={styles.heroTag}>RECOMENDADO</Text></View>
            <Text style={styles.heroTitle}>{recommendedMovie?.title ?? 'Una noche para recordar'}</Text>
            <Text style={styles.heroDescription}>
              {recommendedMovie ? 'Reserva tu experiencia recomendada.' : 'Descubre cine, música y fútbol en un solo lugar.'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.kicker}>CATÁLOGO COMPLETO</Text>
            <Text style={styles.sectionTitle}>Películas y experiencias</Text>
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
              <Text style={styles.meta}>{showtime ? `${formatShowtime(showtime.startTime)} • ${showtime.room.name}` : 'Próximamente'}</Text>
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
                  <Text style={styles.buyText}>{showtime ? 'Reservar' : 'Próximamente'}</Text>
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
    notificationsList: { gap: 10, paddingTop: 18 },
    notificationItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
    notificationBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
    notificationBadgeInfo: { backgroundColor: colors.primary + '20' },
    notificationBadgeSuccess: { backgroundColor: colors.success + '20' },
    notificationBadgeWarning: { backgroundColor: colors.warning + '20' },
    notificationBadgeText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    notificationCopy: { flex: 1 },
    notificationTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
    notificationText: { color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 18 },
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
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.text },
  heroCard: { height: 205, borderRadius: radii.large, overflow: 'hidden', marginBottom: 24, backgroundColor: colors.surface, ...shadows.card },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  quickCard: { width: 156, height: 125, borderRadius: radii.card, padding: 15, justifyContent: 'space-between', ...shadows.card },
  quickCardBlue: { backgroundColor: colors.primary },
  quickCardCoral: { backgroundColor: colors.critical },
  quickCardGreen: { backgroundColor: colors.success },
  quickCardGold: { backgroundColor: '#8D6F19' },
  quickCardNavy: { backgroundColor: colors.surfaceRaised },
  quickCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  upcomingStrip: { gap: 10, paddingBottom: 20 },
  upcomingTile: { width: 220, height: 126, borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, position: 'relative', ...shadows.card },
  upcomingMatchTile: { padding: 14, justifyContent: 'flex-end', backgroundColor: '#173B5E' },
  upcomingTileImage: { width: '100%', height: '100%' },
  upcomingTileOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end', padding: 12, backgroundColor: 'rgba(10, 37, 64, 0.58)' },
  upcomingTileTag: { color: colors.warning, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  upcomingTileTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 4 },
  upcomingTileMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  quickTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  quickMeta: { color: 'rgba(247,249,252,0.82)', fontSize: 11, marginTop: 2 },
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
  upcomingOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end', padding: 12, backgroundColor: 'rgba(10, 37, 64, 0.5)' },
  upcomingTag: { color: colors.warning, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  upcomingTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  upcomingSynopsis: { color: 'rgba(248,250,252,0.78)', fontSize: 11, lineHeight: 15, marginTop: 5 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadows.card },
  poster: { width: 118, height: 196 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movieTitle: { flex: 1, color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '800', marginRight: 8, fontFamily: typography.display },
  rating: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  synopsis: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 9, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  price: { color: colors.text, fontSize: 16, fontWeight: '800' },
  buyButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.control, ...shadows.button },
  buyText: { color: colors.text, fontWeight: '700' },
  stateContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
});
