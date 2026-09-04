import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: '#0EA5E9',
  card: '#0F172A',
  muted: '#94A3B8',
};

type FloorFilter = 'ALL' | '1' | '2' | '3';
const floorFilters: Array<{ key: FloorFilter; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: '1', label: 'Piso 1 (Nivel A)' },
  { key: '2', label: 'Piso 2 (Nivel B)' },
  { key: '3', label: 'Piso 3 (Nivel C)' },
];

interface SpotPickerMapProps {
  garage: { name: string; address: string; price?: number | string; floorsCount?: number; totalSpaces?: number; reservedSpaceNumbers?: number[]; spaces?: Array<{ spaceNumber: number; floor: number; code: string; status: 'AVAILABLE' | 'MAINTENANCE' | 'CLOSED'; occupied?: boolean }> };
  selectedFloor: number;
  setSelectedFloor: (floor: number) => void;
  selectedSpot: string | null;
  setSelectedSpot: (spot: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const SpotPickerMap: React.FC<SpotPickerMapProps> = ({
  garage,
  selectedFloor,
  setSelectedFloor,
  selectedSpot,
  setSelectedSpot,
  onConfirm,
  onBack,
}) => {
  const displayName = garage.name.replace(/\s*\((?:demo|demostración)\)/gi, '').trim();
  const [floorFilter, setFloorFilter] = useState<FloorFilter>('ALL');
  const configuredSpaces = garage.spaces ?? [];
  const spots = configuredSpaces.length
    ? configuredSpaces
    : Array.from({ length: garage.totalSpaces ?? 8 }, (_, index) => ({ code: `${String.fromCharCode(65 + Math.floor((index % 8) / 4))}${(index % 4) + 1}-${Math.floor(index / 8) + 1}`, spaceNumber: index + 1, status: 'AVAILABLE' as const, occupied: false }));
  const visibleSpots = floorFilter === 'ALL'
    ? spots
    : spots.filter((spot) => spot.code.startsWith(floorFilter === '1' ? 'A' : floorFilter === '2' ? 'B' : 'C') || ('floor' in spot && spot.floor === Number(floorFilter)));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
        <Text style={styles.backText}>Volver a garajes</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.subTitle}>{garage.address}</Text>

      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floorFilters}>
        {floorFilters.map((filter) => {
          const active = floorFilter === filter.key;
          return <TouchableOpacity key={filter.key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFloorFilter(filter.key)} style={[styles.floorFilter, active && styles.floorFilterActive]}>
            <Text style={[styles.floorFilterText, active && styles.floorFilterTextActive]}>{filter.label}</Text>
          </TouchableOpacity>;
        })}
      </ScrollView>

      <View style={styles.grid}>
        {visibleSpots.map((spot) => {
          const configuredSpace = configuredSpaces.find((space) => space.spaceNumber === spot.spaceNumber);
          const isReserved = configuredSpace?.occupied || garage.reservedSpaceNumbers?.includes(spot.spaceNumber) || configuredSpace?.status !== undefined && configuredSpace.status !== 'AVAILABLE' || false;
          const isSelected = selectedSpot === spot.code;
          return (
            <TouchableOpacity
              key={spot.code}
              disabled={isReserved}
              onPress={() => setSelectedSpot(spot.code)}
              style={[styles.spot, configuredSpace?.status === 'MAINTENANCE' && styles.spotMaintenance, configuredSpace?.status === 'CLOSED' && styles.spotClosed, isReserved && styles.spotReserved, isSelected && styles.spotSelected]}
            >
              <Text style={[styles.spotText, isReserved && styles.spotTextReserved, isSelected && styles.textWhite]}>{spot.code}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        disabled={!selectedSpot}
        onPress={onConfirm}
        style={[styles.confirmBtn, !selectedSpot && styles.btnDisabled]}
      >
        <Text style={styles.confirmText}>
          {selectedSpot ? `Reservar Plaza ${selectedSpot}` : 'Selecciona una plaza'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 16, gap: 8 },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  subTitle: { color: colors.muted, fontSize: 12 },
  textWhite: { color: '#FFF' },
  floorFilters: { gap: 6, paddingVertical: 2 },
  floorFilter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  floorFilterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  floorFilterText: { color: colors.muted, fontSize: 11, fontWeight: 'bold' },
  floorFilterTextActive: { color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  spot: { width: '22%', height: 60, backgroundColor: '#1E293B', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  spotSelected: { backgroundColor: '#10B981' },
  spotReserved: { backgroundColor: '#334155', opacity: 0.65 },
  spotMaintenance: { backgroundColor: '#854D0E' },
  spotClosed: { backgroundColor: '#7F1D1D' },
  spotText: { color: '#FFF', fontWeight: 'bold' },
  spotTextReserved: { color: '#94A3B8' },
  confirmBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  btnDisabled: { opacity: 0.5 },
  confirmText: { color: '#FFF', fontWeight: 'bold' },
});