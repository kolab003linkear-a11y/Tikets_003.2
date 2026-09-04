import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { createParkingTicket, getMyTickets, getParking, ParkingLot, ParkingTicketResponse, payParkingTicket, TicketDetails } from '../api/client';
import { PaymentModal } from '../components/parking/PaymentModal';
import { ActiveTicketCard } from '../components/parking/ActiveTicketCard';
import { SpotPickerMap } from '../components/parking/FloorMap';
import { useFocusEffect, useNavigation } from '@react-navigation/native';


export default function ParkingScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [parking, setParking] = useState<ParkingLot[]>([]);
  const [selected, setSelected] = useState<ParkingLot | null>(null);
  const [space, setSpace] = useState<string>('');
  const [ticket, setTicket] = useState<ParkingTicketResponse['ticket'] | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [buying, setBuying] = useState<boolean>(false);
  const [paying, setPaying] = useState(false);
  const [search, setSearch] = useState('');

  const cleanParkingName = (name: string) => name.replace(/\s*\((?:demo|demostración)\)/gi, '').trim();
  const getSpotCode = (spaceNumber: number) => {
    const index = (spaceNumber - 1) % 8;
    return `${String.fromCharCode(65 + Math.floor(index / 4))}${(index % 4) + 1}`;
  };
  const getFloor = (spaceNumber: number) => Math.floor((spaceNumber - 1) / 8) + 1;
  const visibleParking = parking.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [item.name, item.address, item.city].some((value) => value.toLowerCase().includes(query));
  });

  const loadParking = useCallback(async () => {
    const response = await getParking();
    setParking(response.parking);
    setSelected((current) => current ? response.parking.find((item) => item.id === current.id) ?? current : current);
  }, []);

  const restoreActiveTicket = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getMyTickets(token);
      const active = response.tickets.find((item: TicketDetails) => item.qrPayload.startsWith('parkingsafe:') && item.status === 'VALID');
      if (active) {
        setTicket({ id: active.id, spaceNumber: Number(active.seatNumber), date: active.event.startTime, createdAt: active.createdAt, status: 'VALID', qrPayload: active.qrPayload, parking: { id: '', name: cleanParkingName(active.event.title), address: active.event.room, city: '', totalSpaces: 0, price: 0, operator: '', openingHours: '', terminalName: null, accessMode: 'QR', vehicleTypes: [], status: 'ACTIVE' } });
      }
    } catch {
      // The parking list remains usable when ticket history is unavailable.
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void restoreActiveTicket(); }, [restoreActiveTicket]));

  useEffect(() => {
    void loadParking().catch((error) => {
      Alert.alert('No se pudieron cargar los parqueaderos', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    });
  }, [loadParking]);

  const reserve = async () => {
    if (!selected || !space) {
      Alert.alert('Datos incompletos', 'Selecciona un parqueadero y una plaza.');
      return;
    }
    if (!token) {
      navigation.navigate('Auth', { fromPurchase: true });
      return;
    }

    try {
      const configuredSpace = selected.spaces?.find((item) => item.code === space);
      const floor = selectedFloor;
      const spotIndex = Number(space.slice(1)) + (space.charCodeAt(0) - 65) * 4;
      const spaceNumber = configuredSpace?.spaceNumber ?? (floor - 1) * 8 + spotIndex;
      const response = await createParkingTicket(token, selected.id, spaceNumber, new Date().toISOString());
      setTicket(response.ticket);
      setBuying(false);
    } catch (error) {
      Alert.alert('No se pudo reservar la plaza', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {selected ? (
          <SpotPickerMap
            garage={selected}
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
            selectedSpot={space || null}
            setSelectedSpot={setSpace}
            onConfirm={() => void reserve()}
            onBack={() => { setSelected(null); setSpace(''); setSelectedFloor(1); }}
          />
        ) : (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={19} color="#94A3B8" />
              <TextInput
                accessibilityLabel="Buscar parqueadero"
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar parqueadero, dirección o ciudad"
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={19} color="#94A3B8" />
                </Pressable>
              )}
            </View>
            {visibleParking.length > 0 ? visibleParking.map((item: ParkingLot) => (
              <Pressable key={item.id} style={styles.card} onPress={() => setSelected(item)}>
                <Text style={styles.cardTitle}>{cleanParkingName(item.name)}</Text>
                <Text style={styles.cardMeta}>{item.address} · {item.city} · ${Number(item.price).toFixed(2)}</Text>
              </Pressable>
            )) : (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No encontramos parqueaderos</Text>
                <Text style={styles.emptyText}>Prueba con otro nombre, dirección o ciudad.</Text>
              </View>
            )}
          </>
        )}

        {ticket ? (
          <>
            <Text style={styles.activeHeading}>TICKET ACTIVO</Text>
            <Text style={styles.activeSubheading}>Tu QR y tiempo de estacionamiento</Text>
            <ActiveTicketCard
              ticketId={ticket.id}
              garageName={ticket.parking.name}
              spotCode={`${getSpotCode(ticket.spaceNumber)} - Piso ${getFloor(ticket.spaceNumber)}`}
              qrPayload={ticket.qrPayload}
              createdAt={ticket.createdAt ?? ticket.date}
              hourlyRate={Number(ticket.parking.price) || 3.5}
              onOpenPayment={() => setBuying(true)}
            />
          </>
        ) : null}
      </ScrollView>

      <PaymentModal
        isOpen={buying}
        onClose={() => setBuying(false)}
        totalAmount={ticket ? Number(ticket.parking.price) || 3.75 : 3.75}
        parkingOnly
        onConfirmPayment={async (method) => {
          if (!token || !ticket) return;
          setPaying(true);
          try {
            await payParkingTicket(token, ticket.id, method);
            setTicket(null);
            setBuying(false);
            await loadParking();
            Alert.alert('Pago confirmado', 'La salida ha sido habilitada.');
          } catch (error) {
            Alert.alert('No se pudo procesar el pago', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
          } finally {
            setPaying(false);
          }
        }}
        processing={paying}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardMeta: {
    color: '#94A3B8',
    marginTop: 6,
  },
  searchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#081D33',
    borderColor: '#0EA5E9',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    outlineStyle: 'none',
  } as object,
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  activeHeading: {
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 12,
  },
  activeSubheading: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 2,
  },
});