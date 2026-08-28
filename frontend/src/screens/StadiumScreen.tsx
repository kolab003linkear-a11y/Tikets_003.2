import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createMatchTicket, getMatches, StadiumMatch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import AppState from '../components/AppState';
import ProfileAvatar from '../components/ProfileAvatar';

const defaultStadiumImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
const stadiumImages: Record<string, string> = {
  'Estadio Olímpico Atahualpa': 'https://images.unsplash.com/photo-1579952363873-27f3bede9f55?auto=format&fit=crop&w=1200&q=80',
  'Monumental Banco Pichincha': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
  'Estadio Capwell': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  'Estadio Moreno Martínez': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
};
const teamLogos: Record<string, string> = {
  'LDU Quito': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/LDU_Logo.svg',
  'Barcelona SC': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Barcelona_Sporting_Club_logo.svg',
  Emelec: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Club_Sport_Emelec_logo.svg',
};

function getStadiumImage(stadiumName: string, imageUrl?: string | null) {
  return imageUrl ?? stadiumImages[stadiumName] ?? defaultStadiumImage;
}

function getTeamLogo(teamName: string) {
  return teamLogos[teamName];
}

function StadiumImage({ uri, style }: { uri: string; style: object }) {
  const [source, setSource] = useState(uri);

  return <Image source={{ uri: source }} style={style} resizeMode="cover" onError={() => setSource(defaultStadiumImage)} />;
}

export default function StadiumScreen() {
  const navigation = useNavigation<any>();
  const { token, user, startGuestSession } = useAuth();
  const [matches, setMatches] = useState<StadiumMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<StadiumMatch | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'TODOS' | 'LIVE' | 'SCHEDULED'>('TODOS');
  const [cityFilter, setCityFilter] = useState('Todas');
  const [teamSearch, setTeamSearch] = useState('');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMatches();
      setMatches(response.matches);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los partidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMatches(); }, [loadMatches]);

  const visibleMatches = useMemo(
    () => matches.filter((match) => {
      const matchesStatus = filter === 'TODOS' || match.status === filter;
      const matchesCity = cityFilter === 'Todas' || match.stadium.city === cityFilter;
      const search = teamSearch.trim().toLowerCase();
      const matchesTeam = !search || `${match.homeTeam} ${match.awayTeam}`.toLowerCase().includes(search);
      return matchesStatus && matchesCity && matchesTeam;
    }),
    [cityFilter, filter, matches, teamSearch],
  );

  const cities = useMemo(() => ['Todas', ...new Set(matches.map((match) => match.stadium.city))], [matches]);

  const chooseMatch = (match: StadiumMatch) => {
    setSelectedMatch(match);
    setSelectedSectorId(match.stadium.sectors[0]?.id ?? '');
    setSeatNumber('');
  };

  const chooseSector = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    setSeatNumber('');
  };

  const buyTicket = async () => {
    if (!selectedMatch || !selectedSectorId || !seatNumber.trim()) {
      Alert.alert('Datos incompletos', 'Selecciona un sector e indica tu localidad.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || fullName.trim().length < 2 || !/^[+\d\s()-]{7,30}$/.test(phone.trim())) {
      Alert.alert('Completa tus datos', 'Necesitamos tu nombre completo y teléfono para continuar con la compra.');
      return;
    }
    setBuying(true);
    try {
      const session = user && token ? { user, token } : await startGuestSession(email.trim().toLowerCase(), fullName.trim(), phone.trim());
      const response = await createMatchTicket(session.token, selectedMatch.id, selectedSectorId, seatNumber);
      navigation.navigate('Ticket', {
        ticketId: response.ticket.id,
        qrPayload: response.ticket.qrPayload,
        status: response.ticket.status,
        movieTitle: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
        selectedSeats: [response.ticket.seatNumber],
        startTime: selectedMatch.startTime,
        roomName: `${selectedMatch.stadium.name} · ${response.ticket.sector}`,
      });
      setSelectedMatch(null);
    } catch (buyError) {
      Alert.alert('No se pudo generar el ticket', buyError instanceof Error ? buyError.message : 'Inténtalo nuevamente.');
    } finally {
      setBuying(false);
    }
  };

  const getSectorRows = (sectorId: string): Array<{ label: string; seats: string[] }> => {
    const sector = selectedMatch?.stadium.sectors.find((s) => s.id === sectorId);
    if (!sector || !sector.seatLayout) return [];
    try {
      const layout = typeof sector.seatLayout === 'string' ? JSON.parse(sector.seatLayout) : sector.seatLayout;
      if (!Array.isArray(layout.rows) || typeof layout.columns !== 'number') return [];
      return layout.rows.flatMap((row: unknown) => {
        if (typeof row === 'string') {
          return [{ label: row, seats: Array.from({ length: layout.columns }, (_, index) => `${row}${index + 1}`) }];
        }
        if (row && typeof row === 'object' && 'seats' in row && Array.isArray(row.seats)) {
          const seats = row.seats.filter((seat: unknown): seat is string => typeof seat === 'string');
          return [{ label: seats[0]?.replace(/\d+$/, '') ?? '', seats }];
        }
        return [];
      });
    } catch {
      return [];
    }
  };

  const selectedSector = selectedMatch?.stadium.sectors.find((sector) => sector.id === selectedSectorId);
  const occupiedSeats = selectedSector?.occupiedSeats ?? [];
  const sectorRows = getSectorRows(selectedSectorId);
  const sectorSeats = sectorRows.flatMap((row) => row.seats);
  const availableSeats = sectorSeats.filter((seat) => !occupiedSeats.includes(seat));

  return (
    <SafeAreaView style={styles.safeArea}>
      {selectedMatch ? (
        <ScrollView contentContainerStyle={styles.containerScroll}>
          <Pressable onPress={() => setSelectedMatch(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={styles.backText}>Volver a partidos</Text>
          </Pressable>
          <AppCard style={styles.purchaseCard}>
            <StadiumImage uri={getStadiumImage(selectedMatch.stadium.name, selectedMatch.stadium.imageUrl)} style={styles.purchaseImage} />
            <View style={styles.purchaseEyebrow}>
              <Text style={styles.heroTag}>{selectedMatch.status === 'LIVE' ? 'En vivo' : 'Entrada de partido'}</Text>
              <Text style={styles.city}>{selectedMatch.stadium.city}</Text>
            </View>
            <View style={styles.matchHeader}>
              <View style={styles.purchaseTeam}>
                <View style={styles.largeTeamBadge}>{getTeamLogo(selectedMatch.homeTeam) ? <Image source={{ uri: getTeamLogo(selectedMatch.homeTeam) }} style={styles.largeTeamLogo} /> : <Text style={styles.largeTeamInitial}>{selectedMatch.homeTeam.charAt(0)}</Text>}</View>
                <Text style={styles.matchTitle}>{selectedMatch.homeTeam}</Text>
              </View>
              <View style={styles.vsBlock}><Text style={styles.vs}>VS</Text><Text style={styles.matchDate}>{new Date(selectedMatch.startTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text></View>
              <View style={styles.purchaseTeam}>
                <View style={[styles.largeTeamBadge, styles.awayBadge]}>{getTeamLogo(selectedMatch.awayTeam) ? <Image source={{ uri: getTeamLogo(selectedMatch.awayTeam) }} style={styles.largeTeamLogo} /> : <Text style={styles.largeTeamInitial}>{selectedMatch.awayTeam.charAt(0)}</Text>}</View>
                <Text style={styles.matchTitle}>{selectedMatch.awayTeam}</Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.infoLabel}>Estadio:</Text>
              <Text style={styles.infoValue}>{selectedMatch.stadium.name}</Text>
              <Text style={styles.infoLabel}>Ciudad:</Text>
              <Text style={styles.infoValue}>{selectedMatch.stadium.city}</Text>
              <Text style={styles.infoLabel}>Fecha y hora:</Text>
              <Text style={styles.infoValue}>{new Date(selectedMatch.startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            </View>

            <View style={styles.selectionHeading}>
              <Text style={styles.sectionTitle}>Elige tu sector</Text>
              <Text style={styles.selectionHint}>1 entrada</Text>
            </View>
            <View style={styles.options}>
              {selectedMatch.stadium.sectors.map((sector) => (
                <Pressable
                  key={sector.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedSectorId === sector.id }}
                  style={[styles.option, selectedSectorId === sector.id && styles.optionSelected]}
                  onPress={() => chooseSector(sector.id)}
                >
                  <Text style={[styles.optionText, selectedSectorId === sector.id && styles.optionTextSelected]}>
                    {sector.name}
                  </Text>
                  <Text style={[styles.optionCapacity, selectedSectorId === sector.id && styles.optionTextSelected]}>
                    {Math.max(0, sector.capacity - (sector.occupiedSeats?.length ?? 0)).toLocaleString('es-ES')} libres
                  </Text>
                  <Text style={[styles.optionPrice, selectedSectorId === sector.id && styles.optionTextSelected]}>
                    ${Number(sector.price).toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.selectionHeading}>
              <Text style={styles.sectionTitle}>Elige tu localidad</Text>
              <Text style={styles.selectionHint}>{seatNumber ? 'Seleccionada' : 'Obligatorio'}</Text>
            </View>
            {availableSeats.length > 0 ? (
              <>
                <View style={styles.legend}>
                  <View style={styles.legendItem}><View style={styles.legendSwatch} /><Text style={styles.legendText}>Libre</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendSwatch, styles.legendOccupied]} /><Text style={styles.legendText}>Ocupada</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendSwatch, styles.legendSelected]} /><Text style={styles.legendText}>Seleccionada</Text></View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seatMapScroll}>
                  <View style={styles.seatMap}>
                    {sectorRows.map((row) => (
                      <View key={row.label} style={styles.seatRow}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        <View style={styles.seatsGrid}>
                          {row.seats.map((seat) => {
                            const occupied = occupiedSeats.includes(seat);
                            return (
                              <Pressable
                                key={seat}
                                accessibilityRole="button"
                                accessibilityLabel={`Localidad ${seat}`}
                                accessibilityState={{ selected: seatNumber === seat, disabled: occupied }}
                                style={[styles.seat, occupied && styles.seatOccupied, seatNumber === seat && styles.seatSelected]}
                                disabled={occupied}
                                onPress={() => setSeatNumber(seat)}
                              >
                                <Text style={[styles.seatText, seatNumber === seat && styles.seatTextSelected]}>{seat.replace(/^[A-Za-z]+/, '')}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            ) : (
              <View style={styles.noSeats}>
                <Text style={styles.noSeatsText}>{sectorSeats.length > 0 ? 'Este sector ya no tiene localidades disponibles.' : 'Ingresa tu localidad manualmente'}</Text>
                <AppInput label="Localidad" value={seatNumber} onChangeText={setSeatNumber} placeholder="Ej. A1" autoCapitalize="characters" />
              </View>
            )}

            {seatNumber && (
              <View style={styles.summary}>
                <Text style={styles.summaryText}>Localidad seleccionada: <Text style={styles.summaryBold}>{seatNumber}</Text></Text>
                <Text style={styles.summaryText}>Sector: <Text style={styles.summaryBold}>{selectedMatch.stadium.sectors.find((s) => s.id === selectedSectorId)?.name}</Text></Text>
                <Text style={styles.summaryText}>Precio: <Text style={styles.summaryBold}>${Number(selectedMatch.stadium.sectors.find((s) => s.id === selectedSectorId)?.price).toFixed(2)}</Text></Text>
              </View>
            )}

            {(!user?.fullName || !user?.phone) && <View style={styles.profileCard}>
              <Text style={styles.profileTitle}>Datos para tu compra</Text>
              <Text style={styles.profileHint}>Solo te los pedimos una vez para emitir tu entrada.</Text>
              <AppInput label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="tu@correo.com" />
              <AppInput label="Nombre completo" autoCapitalize="words" value={fullName} onChangeText={setFullName} placeholder="Ej. Ana García" />
              <AppInput label="Teléfono" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="099 123 4567" />
            </View>}
            <AppButton label="Generar ticket QR" onPress={() => void buyTicket()} disabled={buying || !seatNumber} loading={buying} />
            <AppButton label="Cancelar" variant="secondary" onPress={() => setSelectedMatch(null)} disabled={buying} />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={visibleMatches}
          keyExtractor={(match) => match.id}
          contentContainerStyle={styles.container}
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.overline}>Experiencias en vivo</Text>
                  <Text style={styles.title}>Estadios</Text>
                </View>
                <View style={styles.headerIcon}>
                  <Ionicons name="football" size={22} color={colors.text} />
                </View>
                <ProfileAvatar />
              </View>
              <View style={styles.heroCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80' }}
                  style={styles.heroImage}
                />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTag}>Vive el partido</Text>
                  <Text style={styles.heroTitle}>La grada te espera</Text>
                  <Text style={styles.heroText}>Elige tu sector y recibe tu acceso digital al instante.</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{matches.length}</Text>
                  <Text style={styles.statLabel}>Partidos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{matches.filter((match) => match.status === 'LIVE').length}</Text>
                  <Text style={styles.statLabel}>En vivo</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{new Set(matches.map((match) => match.stadium.city)).size}</Text>
                  <Text style={styles.statLabel}>Ciudades</Text>
                </View>
              </View>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Próximos encuentros</Text>
                <Text style={styles.sectionHint}>{visibleMatches.length} disponibles</Text>
              </View>
              <View style={styles.filters}>
                {(['TODOS', 'LIVE', 'SCHEDULED'] as const).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === item }}
                    style={[styles.filter, filter === item && styles.filterSelected]}
                    onPress={() => setFilter(item)}
                  >
                    {item === 'LIVE' && <View style={styles.liveDot} />}
                    <Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>
                      {item === 'TODOS' ? 'Todos' : item === 'LIVE' ? 'En vivo' : 'Próximos'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={17} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Buscar por equipo"
                  value={teamSearch}
                  onChangeText={setTeamSearch}
                  placeholder="Buscar por equipo"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.searchInput}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityFilters}>
                {cities.map((city) => (
                  <Pressable key={city} accessibilityRole="button" accessibilityState={{ selected: cityFilter === city }} style={[styles.cityFilter, cityFilter === city && styles.cityFilterSelected]} onPress={() => setCityFilter(city)}>
                    <Ionicons name="location-outline" size={13} color={cityFilter === city ? colors.text : colors.textSecondary} />
                    <Text style={[styles.cityFilterText, cityFilter === city && styles.cityFilterTextSelected]}>{city}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <AppState loading title="Cargando partidos..." />
            ) : error ? (
              <View style={styles.errorContainer}>
                <AppState title="No se pudieron cargar los partidos" message={error} />
                <AppButton label="Reintentar" onPress={() => void loadMatches()} />
              </View>
            ) : (
              <AppState title="No hay partidos disponibles" message="Vuelve a consultar más tarde." />
            )
          }
          renderItem={({ item }) => (
            <AppCard style={styles.matchCard}>
              <View style={styles.matchVisual}>
                <StadiumImage uri={getStadiumImage(item.stadium.name, item.stadium.imageUrl)} style={styles.matchImage} />
                <View style={styles.imageCaption} pointerEvents="none">
                  <Text style={styles.imageTitle} numberOfLines={1}>{item.stadium.name}</Text>
                  <View style={styles.imageLocation}><Ionicons name="location-outline" size={13} color={colors.text} /><Text style={styles.imageCity}>{item.stadium.city}</Text></View>
                </View>
              </View>
              <View style={styles.cardTopline}>
                <View style={styles.statusWrap}>
                  <View style={[styles.statusDot, item.status === 'LIVE' && styles.statusDotLive]} />
                  <Text style={[styles.status, item.status === 'LIVE' && styles.statusLive]}>
                    {item.status === 'LIVE' ? 'EN VIVO' : 'PRÓXIMO'}
                  </Text>
                </View>
                <Text style={styles.city}>{item.stadium.city}</Text>
              </View>
              <View style={styles.matchRow}>
                <View style={[styles.teamBadge, styles.homeBadge]}>{getTeamLogo(item.homeTeam) ? <Image source={{ uri: getTeamLogo(item.homeTeam) }} style={styles.teamLogo} /> : <Text style={styles.teamInitial}>{item.homeTeam.charAt(0)}</Text>}</View>
                <View style={styles.matchTeam}>
                  <Text style={styles.teamName}>{item.homeTeam}</Text>
                  <Text style={styles.vs}>contra</Text>
                  <Text style={styles.teamName}>{item.awayTeam}</Text>
                </View>
                <View style={[styles.teamBadge, styles.awayBadge]}>{getTeamLogo(item.awayTeam) ? <Image source={{ uri: getTeamLogo(item.awayTeam) }} style={styles.teamLogo} /> : <Text style={styles.teamInitial}>{item.awayTeam.charAt(0)}</Text>}</View>
              </View>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={styles.meta}>{new Date(item.startTime).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={styles.meta} numberOfLines={1}>{item.stadium.name}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.priceLabel}>Desde</Text>
                  <Text style={styles.price}>${Math.min(...item.stadium.sectors.map((sector) => Number(sector.price))).toFixed(2)}</Text>
                </View>
                <AppButton label="Ver localidades" onPress={() => chooseMatch(item)} />
              </View>
            </AppCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12 },
  containerScroll: { padding: 16, gap: 12 },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroCard: { height: 190, borderRadius: 18, overflow: 'hidden', marginBottom: 14, backgroundColor: colors.surface },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayStrong, justifyContent: 'flex-end', padding: 16 },
  heroTag: { color: colors.warning, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: 27, fontWeight: '800', marginTop: 4, fontFamily: typography.display },
  heroText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: '82%' },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, marginBottom: 22 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: colors.border },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  sectionHint: { color: colors.textSecondary, fontSize: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 8 },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: colors.text },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.critical },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, minHeight: 46, paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 10 },
  cityFilters: { gap: 8, paddingVertical: 10 },
  cityFilter: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  cityFilterSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary },
  cityFilterText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  cityFilterTextSelected: { color: colors.text },
  matchCard: { gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  matchVisual: { width: '100%', height: 170, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.input },
  matchImage: { width: '100%', height: '100%', backgroundColor: colors.input },
  imageCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayStrong, paddingHorizontal: 14, paddingVertical: 11 },
  imageTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  imageLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  imageCity: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  purchaseCard: { gap: 16, marginBottom: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  purchaseImage: { width: '100%', height: 190, borderRadius: 12, marginBottom: 4, backgroundColor: colors.input },
  purchaseEyebrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 14 },
  purchaseTeam: { flex: 1, alignItems: 'center', gap: 7 },
  largeTeamBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#123F55', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  largeTeamLogo: { width: 34, height: 34 },
  largeTeamInitial: { color: colors.primary, fontSize: 21, fontWeight: '800' },
  vsBlock: { alignItems: 'center', gap: 4 },
  matchDate: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  matchTitle: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  vs: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },
  info: { backgroundColor: colors.border + '20', borderRadius: 8, padding: 12, gap: 6 },
  infoLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  statusDotLive: { backgroundColor: colors.critical },
  meta: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  city: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  status: { color: colors.success, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  statusLive: { color: colors.critical },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8 },
  selectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  selectionHint: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderColor: colors.border, borderWidth: 1.5, borderRadius: 8, padding: 12, flex: 1, minWidth: '45%' },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  optionTextSelected: { color: colors.background },
  optionCapacity: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  optionPrice: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', marginTop: 7 },
  seatMapScroll: { paddingVertical: 8, paddingRight: 10 },
  seatMap: { gap: 5, minWidth: 420 },
  seatRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowLabel: { width: 22, color: colors.textSecondary, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  seatsGrid: { flexDirection: 'row', gap: 4 },
  seat: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  seatOccupied: { backgroundColor: colors.input, borderColor: colors.border, opacity: 0.45 },
  seatSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  seatText: { color: colors.text, fontSize: 9, fontWeight: '700' },
  seatTextSelected: { color: colors.background },
  noSeats: { gap: 8 },
  noSeatsText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 11, height: 11, borderRadius: 3, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  legendOccupied: { backgroundColor: colors.input, opacity: 0.5 },
  legendSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  legendText: { color: colors.textSecondary, fontSize: 10 },
  summary: { backgroundColor: colors.primary + '15', borderRadius: 8, padding: 12, gap: 4 },
  summaryText: { color: colors.text, fontSize: 13 },
  summaryBold: { fontWeight: '800', color: colors.primary },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: 8 },
  matchTeam: { flex: 1, alignItems: 'center', gap: 2 },
  teamName: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  teamBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  teamLogo: { width: 27, height: 27 },
  homeBadge: { backgroundColor: '#123F55' },
  awayBadge: { backgroundColor: '#3A2543', borderColor: colors.critical + '80' },
  teamInitial: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  detailsRow: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  priceLabel: { color: colors.textSecondary, fontSize: 11 },
  price: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  errorContainer: { gap: 12 },
  profileCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, padding: 14, marginTop: 8 },
  profileTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  profileHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 },
});
