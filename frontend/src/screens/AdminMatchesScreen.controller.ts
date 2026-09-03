import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  AdminMatch,
  AdminMatchInput,
  AdminStadium,
  createAdminMatch,
  getAdminMatches,
  getAdminMatchPrices,
  getAdminStadiums,
  getTeams,
  MatchSectorPriceInput,
  Team,
  updateAdminMatch,
} from '../api/client';

// ---------------------------------------------------------------------------
// Controlador del módulo "Partidos" (arquitectura Vista-Controlador).
// Depende de Estadios y Equipos ya registrados (matchSchema en
// backend/src/server.ts exige stadiumId, homeTeamId y awayTeamId válidos).
//
// El precio de cada sector para el partido se define aquí mismo, al crear o
// editar (draft.sectorPrices), en vez de en un paso aparte: se manda junto
// con el resto del formulario a POST/PATCH /api/admin/matches.
// ---------------------------------------------------------------------------

export type MatchStatusOption = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export type MatchDraft = {
  stadiumId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: MatchStatusOption;
  // sectorId -> texto escrito por el admin. Vacío o ausente = precio base del sector.
  sectorPrices: Record<string, string>;
};

const emptyDraft: MatchDraft = {
  stadiumId: '',
  homeTeamId: '',
  awayTeamId: '',
  startTime: '',
  status: 'SCHEDULED',
  sectorPrices: {},
};

export function useAdminMatchesController() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [stadiums, setStadiums] = useState<AdminStadium[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draft, setDraft] = useState<MatchDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const upcomingCount = useMemo(
    () => matches.filter((match) => match.status === 'SCHEDULED' || match.status === 'LIVE').length,
    [matches],
  );

  // Sectores del estadio seleccionado en el formulario (para dibujar un
  // campo de precio por cada uno). `stadiums` ya trae `sectors` porque
  // getAdminStadiums() los incluye.
  const selectedStadiumSectors = useMemo(
    () => stadiums.find((stadium) => stadium.id === draft.stadiumId)?.sectors ?? [],
    [stadiums, draft.stadiumId],
  );

  // Carga partidos + catálogos de estadios y equipos (necesarios para armar
  // los selectores del formulario) en paralelo.
  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [matchesResponse, stadiumsResponse, teamsResponse] = await Promise.all([
        getAdminMatches(token),
        getAdminStadiums(token),
        getTeams(),
      ]);
      setMatches(matchesResponse.matches);
      setStadiums(stadiumsResponse.stadiums);
      setTeams(teamsResponse.teams);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los partidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  function updateDraft<K extends keyof Omit<MatchDraft, 'sectorPrices'>>(key: K, value: MatchDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  // Cambiar de estadio cambia también el set de sectores disponibles, así
  // que los precios personalizados que se hayan escrito ya no aplican.
  function selectStadium(stadiumId: string) {
    setDraft((current) => ({ ...current, stadiumId, sectorPrices: {} }));
  }

  function updateSectorPrice(sectorId: string, value: string) {
    setDraft((current) => ({ ...current, sectorPrices: { ...current.sectorPrices, [sectorId]: value } }));
  }

  async function startEditing(match: AdminMatch) {
    setEditingId(match.id);
    setDraft({
      stadiumId: match.stadiumId,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      // Mismo recorte que usa AdminScheduleScreen para precargar un <input> de fecha/hora.
      startTime: match.startTime.slice(0, 16),
      status: match.status,
      sectorPrices: {},
    });

    // Trae los precios personalizados ya guardados para precargarlos en el
    // formulario. Si falla, se edita igual con los precios base en blanco
    // (el admin puede reintentar o ajustar desde "Precios" en la lista).
    if (!token) return;
    try {
      const response = await getAdminMatchPrices(token, match.id);
      setDraft((current) => ({
        ...current,
        sectorPrices: Object.fromEntries(
          response.prices.filter((entry) => entry.matchPrice !== null).map((entry) => [entry.sectorId, String(entry.matchPrice)]),
        ),
      }));
    } catch {
      // Silencioso: el formulario sigue siendo usable con precios base.
    }
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function buildPayload(): AdminMatchInput | null {
    if (!draft.stadiumId) {
      Alert.alert('Falta el estadio', 'Selecciona en qué estadio se juega el partido.');
      return null;
    }
    if (!draft.homeTeamId || !draft.awayTeamId) {
      Alert.alert('Faltan equipos', 'Selecciona el equipo local y el visitante.');
      return null;
    }
    if (draft.homeTeamId === draft.awayTeamId) {
      Alert.alert('Equipos repetidos', 'El equipo local y el visitante deben ser diferentes.');
      return null;
    }
    if (!draft.startTime.trim()) {
      Alert.alert('Falta la fecha', 'Indica la fecha y hora del partido (ej. 2026-09-15T20:00).');
      return null;
    }

    for (const sector of selectedStadiumSectors) {
      const raw = (draft.sectorPrices[sector.id] ?? '').trim();
      if (raw && (Number.isNaN(Number(raw)) || Number(raw) <= 0)) {
        Alert.alert('Precio inválido', `Revisa el precio del sector "${sector.name}".`);
        return null;
      }
    }

    // Se manda un valor por cada sector del estadio: number = precio
    // personalizado, null = usar el precio base. Así, si al editar el admin
    // borra un precio que antes había puesto, el backend lo elimina.
    const sectorPrices: MatchSectorPriceInput[] = selectedStadiumSectors.map((sector) => {
      const raw = (draft.sectorPrices[sector.id] ?? '').trim();
      return { sectorId: sector.id, price: raw ? Number(raw) : null };
    });

    return {
      stadiumId: draft.stadiumId,
      homeTeamId: draft.homeTeamId,
      awayTeamId: draft.awayTeamId,
      startTime: draft.startTime.trim(),
      status: draft.status,
      sectorPrices,
    };
  }

  async function save() {
    if (!token) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const response = editingId
        ? await updateAdminMatch(token, editingId, payload)
        : await createAdminMatch(token, payload);
      setMatches((current) =>
        editingId ? current.map((match) => (match.id === editingId ? response.match : match)) : [response.match, ...current],
      );
      resetForm();
      Alert.alert('Partido guardado', 'Ya está disponible para vender boletos, con los precios que definiste por sector.');
    } catch (saveError) {
      Alert.alert('No se pudo guardar', saveError instanceof Error ? saveError.message : 'Revisa estadio, equipos y fecha.');
    } finally {
      setSaving(false);
    }
  }

  return {
    isAdmin,
    matches,
    stadiums,
    teams,
    draft,
    editingId,
    loading,
    saving,
    error,
    upcomingCount,
    selectedStadiumSectors,
    loadAll,
    updateDraft,
    selectStadium,
    updateSectorPrice,
    startEditing,
    resetForm,
    save,
  };
}
