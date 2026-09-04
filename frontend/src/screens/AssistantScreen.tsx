import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CatalogMovie, getCatalog, getMatches, StadiumMatch } from '../api/client';
import { colors, radii, shadows } from '../theme';

type Message = { id: string; from: 'assistant' | 'user'; text: string };

const suggestions = ['¿Qué hay hoy?', '¿Cuánto cuesta?', '¿Qué estadios tienen partidos?', '¿Cómo reservo?'];

const ochoymedioTitles = ['Moscas', 'The Odyssey en 35mm', 'La Invitación', 'Cabeza de Ratón', 'Malena', 'Hiedra', 'La Piel Pulpo', 'Viejos malditos'];
const nextWeekMatches = [
  'Martes 1 de septiembre: Delfín vs. Técnico Universitario, 16:30, Estadio Jocay (Manta).',
  'Martes 1 de septiembre: Liga de Quito vs. Mushuc Runa, 19:00, Quito.',
  'Miércoles 2 de septiembre: Macará vs. Manta, 14:00, Estadio Bellavista (Ambato).',
  'Miércoles 2 de septiembre: Deportivo Cuenca vs. Guayaquil City, 16:30, Cuenca.',
  'Miércoles 2 de septiembre: Barcelona SC vs. Independiente del Valle, 19:00, Guayaquil.',
  'Jueves 3 de septiembre: Universidad Católica vs. Aucas, 14:00, Estadio Olímpico Atahualpa (Quito).',
  'Jueves 3 de septiembre: Leones del Norte vs. Orense, 16:30, Atuntaqui.',
  'Jueves 3 de septiembre: Libertad FC vs. Emelec, 19:00, Loja.',
];

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleString('es-EC', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function AssistantScreen() {
  const navigation = useNavigation<any>();
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [matches, setMatches] = useState<StadiumMatch[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', from: 'assistant', text: 'Hola, soy tu asistente TiKetSafe. Puedo ayudarte a encontrar eventos, partidos y resolver dudas sobre tus entradas.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCatalog(), getMatches()])
      .then(([catalog, matchResponse]) => {
        setMovies(catalog.movies);
        setMatches(matchResponse.matches);
      })
      .finally(() => setLoading(false));
  }, []);

  const answer = (question: string) => {
    const normalized = normalizeText(question);
    if (/^(hola|buenas|buenos|hey|hello)/.test(normalized)) {
      return 'Hola. Estoy listo para ayudarte a encontrar una experiencia o resolver tus dudas sobre TiKetSafe.';
    }
    if (normalized.includes('ayuda') || normalized.includes('puedes hacer') || normalized.includes('opciones')) {
      return 'Puedo consultar cartelera, partidos, estadios, horarios, precios y disponibilidad. También puedo explicarte cómo reservar o encontrar tus tickets.';
    }
    if (normalized.includes('ochoymedio') || normalized.includes('8ymedio') || normalized.includes('ocho y medio')) {
      return `La programación de Ochoymedio incluye ${ochoymedioTitles.join(', ')}. Es un cine independiente de La Floresta, Quito. Puedes abrir el evento en Cartelera para revisar su función y reservar cuando esté disponible.`;
    }
    if (normalized.includes('proxima semana') || normalized.includes('siguiente semana') || normalized.includes('septiembre')) {
      return `Agenda informativa de Ecuador para la próxima semana:\n\n${nextWeekMatches.join('\n')}\n\nLa programación del fin de semana del 6 de septiembre aparece todavía con horarios por confirmar; conviene revisar la agenda oficial antes de comprar.`;
    }
    if (normalized.includes('partido') || normalized.includes('estadio') || normalized.includes('futbol') || normalized.includes('equipo')) {
      if (!matches.length) return 'No hay partidos disponibles en este momento.';
      const stadiums = [...new Set(matches.map((match) => match.stadium.name))].join(', ');
      return `Hay ${matches.length} partidos disponibles en ${stadiums}. El próximo es ${matches[0].homeTeam} vs ${matches[0].awayTeam}, ${formatDate(matches[0].startTime)}, en ${matches[0].stadium.name}.`;
    }
    if (normalized.includes('precio') || normalized.includes('cuanto cuesta') || normalized.includes('cuanto vale') || normalized.includes('barato')) {
      const moviePrices = movies.flatMap((movie) => movie.showtimes.map((showtime) => Number(showtime.price))).filter((price) => Number.isFinite(price));
      const matchPrices = matches.flatMap((match) => match.stadium.sectors.map((sector) => Number(sector.price))).filter((price) => Number.isFinite(price));
      const prices = [...moviePrices, ...matchPrices];
      if (!prices.length) return 'Los precios todavía no están disponibles.';
      return `Los precios empiezan desde $${Math.min(...prices).toFixed(2)}. El valor final depende del evento, función o sector que elijas.`;
    }
    if (normalized.includes('horario') || normalized.includes('cuando') || normalized.includes('manana') || normalized.includes('noche')) {
      const nextMovie = movies.find((movie) => movie.showtimes.length);
      const nextMatch = matches[0];
      return `La próxima función disponible es ${nextMovie?.title ?? 'un evento'}${nextMovie?.showtimes[0] ? `, ${formatDate(nextMovie.showtimes[0].startTime)}` : ''}. ${nextMatch ? `También hay partido ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}, ${formatDate(nextMatch.startTime)}.` : ''}`;
    }
    if (normalized.includes('disponibilidad') || normalized.includes('asiento') || normalized.includes('cupo')) {
      const showtime = movies.flatMap((movie) => movie.showtimes)[0];
      return showtime ? `La función con disponibilidad más cercana tiene ${showtime.availableSeats} asientos libres. Selecciona el evento para ver el mapa y elegir tu asiento.` : 'No encontré funciones con disponibilidad en este momento.';
    }
    if (normalized.includes('hoy') || normalized.includes('evento') || normalized.includes('pelicula') || normalized.includes('cine') || normalized.includes('teatro') || normalized.includes('concierto')) {
      if (!movies.length) return 'No hay eventos disponibles en este momento.';
      return `Encontré ${movies.length} experiencias. Puedes explorar ${movies.slice(0, 3).map((movie) => movie.title).join(', ')} desde Cartelera.`;
    }
    if (normalized.includes('reserv') || normalized.includes('compr') || normalized.includes('entrada') || normalized.includes('pagar')) {
      return 'Elige un evento o partido, selecciona tus asientos y continúa con el botón Reservar. Tu entrada aparecerá en Mis Tickets después del pago.';
    }
    if (normalized.includes('ticket') || normalized.includes('boleto') || normalized.includes('entrada')) {
      return 'Puedes consultar tus entradas desde la pestaña Mis Tickets. Después de una compra aprobada, el código QR queda disponible allí.';
    }
    if (normalized.includes('cancel') || normalized.includes('devoluc')) {
      return 'Las reservas pendientes pueden cancelarse desde su detalle. Las condiciones de devolución dependen del estado del pago.';
    }
    if (normalized.includes('gracias')) return 'Con gusto. Estoy aquí cuando necesites encontrar tu próxima experiencia.';
    return 'Puedo ayudarte con cartelera, partidos, estadios, horarios, reservas y tus tickets. Prueba una de las preguntas rápidas.';
  };

  const send = (text = input) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: 'user', text: cleanText },
      { id: `${Date.now()}-assistant`, from: 'assistant', text: answer(cleanText) },
    ]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.botIcon}><Ionicons name="sparkles" size={22} color={colors.text} /></View>
        <View style={styles.headerCopy}><Text style={styles.kicker}>ASISTENTE TICKETSAFE</Text><Text style={styles.title}>¿Qué estás buscando?</Text></View>
        <View style={styles.headerActions}>
          <View style={styles.online}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Activo</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Minimizar asistente" style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar asistente" style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <FlatList data={messages} keyExtractor={(message) => message.id} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false} renderItem={({ item }) => <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={styles.bubbleText}>{item.text}</Text></View>} />}
      <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]} onPress={() => send(suggestion)}><Text style={styles.suggestionText}>{suggestion}</Text></Pressable>)}</View>
      <View style={styles.composer}><TextInput accessibilityLabel="Escribe tu pregunta" value={input} onChangeText={setInput} onSubmitEditing={() => send()} placeholder="Escribe tu pregunta..." placeholderTextColor={colors.textSecondary} style={styles.input} returnKeyType="send" /><Pressable accessibilityRole="button" accessibilityLabel="Enviar pregunta" style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]} onPress={() => send()}><Ionicons name="arrow-up" size={20} color={colors.background} /></Pressable></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  botIcon: { width: 44, height: 44, borderRadius: radii.control, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  headerCopy: { flex: 1, marginLeft: 12 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 3 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  onlineText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerButton: { width: 36, height: 36, borderRadius: radii.control, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center' },
  messages: { padding: 18, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: radii.card },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surfaceRaised, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.border },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 5, ...shadows.button },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  suggestion: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.pill, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 9 },
  suggestionPressed: { backgroundColor: colors.surfaceRaised, opacity: 0.85 },
  suggestionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, height: 48, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.control, color: colors.text, paddingHorizontal: 14 },
  sendButton: { width: 46, height: 46, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  sendButtonPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
