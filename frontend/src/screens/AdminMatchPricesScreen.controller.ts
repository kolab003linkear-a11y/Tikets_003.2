import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AdminMatch, getAdminMatchPrices, updateAdminMatchPrices } from '../api/client';

// ---------------------------------------------------------------------------
// Controlador de "Precios por partido" (arquitectura Vista-Controlador).
//
// Se entra a este módulo desde un partido concreto (AdminMatchesScreen) y
// permite fijar, para CADA sector del estadio de ese partido, un precio que
// solo aplica a este partido (tabla MatchSectorPrice en el backend). Si un
// sector no tiene precio personalizado, sigue vendiéndose al precio base de
// StadiumSector — eso es lo que ve el cliente en la pantalla de compra.
// ---------------------------------------------------------------------------

export type SectorPriceDraft = {
  sectorId: string;
  sectorName: string;
  sectorCode: string;
  basePrice: number | string;
  // Texto del input. Vacío = usar el precio base (sin personalizar).
  value: string;
};

export function useAdminMatchPricesController(match: AdminMatch) {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [entries, setEntries] = useState<SectorPriceDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getAdminMatchPrices(token, match.id);
      setEntries(
        response.prices.map((entry) => ({
          sectorId: entry.sectorId,
          sectorName: entry.sectorName,
          sectorCode: entry.sectorCode,
          basePrice: entry.basePrice,
          value: entry.matchPrice !== null ? String(entry.matchPrice) : '',
        })),
      );
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los precios de este partido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void load();
    // Solo debe recargar si cambia el partido, el token o el rol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, token, isAdmin]);

  function updateValue(sectorId: string, value: string) {
    setEntries((current) => current.map((entry) => (entry.sectorId === sectorId ? { ...entry, value } : entry)));
  }

  // Quita el precio personalizado de un sector: al guardar, ese sector
  // vuelve a usar el precio base de StadiumSector para este partido.
  function resetToBase(sectorId: string) {
    updateValue(sectorId, '');
  }

  const customizedCount = entries.filter((entry) => entry.value.trim() !== '').length;

  async function save() {
    if (!token) return;

    for (const entry of entries) {
      const trimmed = entry.value.trim();
      if (trimmed && (Number.isNaN(Number(trimmed)) || Number(trimmed) <= 0)) {
        Alert.alert('Precio inválido', `Revisa el precio del sector "${entry.sectorName}".`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = entries.map((entry) => ({
        sectorId: entry.sectorId,
        price: entry.value.trim() ? Number(entry.value.trim()) : null,
      }));
      const response = await updateAdminMatchPrices(token, match.id, payload);
      setEntries(
        response.prices.map((entry) => ({
          sectorId: entry.sectorId,
          sectorName: entry.sectorName,
          sectorCode: entry.sectorCode,
          basePrice: entry.basePrice,
          value: entry.matchPrice !== null ? String(entry.matchPrice) : '',
        })),
      );
      Alert.alert('Precios guardados', 'Los precios de este partido ya están disponibles para la venta de boletos.');
    } catch (saveError) {
      Alert.alert('No se pudo guardar', saveError instanceof Error ? saveError.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  return {
    isAdmin,
    entries,
    loading,
    saving,
    error,
    customizedCount,
    load,
    updateValue,
    resetToBase,
    save,
  };
}
