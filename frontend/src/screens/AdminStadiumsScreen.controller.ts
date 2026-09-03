import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AdminStadium, AdminStadiumInput, createAdminStadium, getAdminStadiums } from '../api/client';

// ---------------------------------------------------------------------------
// Controlador del módulo "Estadios" (arquitectura Vista-Controlador).
//
// Este archivo concentra TODA la lógica de la pantalla: estado del formulario,
// validaciones (equivalentes a las de `stadiumSchema` / `stadiumSectorSchema`
// en backend/src/server.ts) y las llamadas a la API (api/client.ts).
//
// `AdminStadiumsScreen.tsx` (la Vista) solo consume lo que este hook expone
// y se encarga exclusivamente de dibujar la interfaz.
// ---------------------------------------------------------------------------

export type SectorDraft = {
  key: string;
  name: string;
  code: string;
  capacity: string;
  price: string;
  rowsText: string;
  columns: string;
};

export type StadiumDraft = {
  name: string;
  city: string;
  capacity: string;
  imageUrl: string;
  rowsText: string;
  columns: string;
  sectors: SectorDraft[];
};

function createDraftKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySector(): SectorDraft {
  return { key: createDraftKey(), name: '', code: '', capacity: '', price: '', rowsText: '', columns: '' };
}

function createEmptyDraft(): StadiumDraft {
  return { name: '', city: '', capacity: '', imageUrl: '', rowsText: '', columns: '', sectors: [createEmptySector()] };
}

// El backend guarda seatLayout como { rows: string[]; columns: number }.
// En el formulario las filas se escriben como texto separado por comas
// (ej. "A,B,C,D"); esta función las convierte al arreglo que espera la API.
export function parseRows(rowsText: string): string[] {
  return rowsText
    .split(',')
    .map((row) => row.trim().toUpperCase())
    .filter(Boolean);
}

// Usado también por la Vista para mostrar el aforo calculado mientras el
// usuario escribe (estadio general y cada sector).
export function computeSeatCount(rowsText: string, columnsText: string): number {
  const rows = parseRows(rowsText);
  const columns = Number(columnsText) || 0;
  return rows.length * columns;
}

export function useAdminStadiumsController() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [stadiums, setStadiums] = useState<AdminStadium[]>([]);
  const [draft, setDraft] = useState<StadiumDraft>(createEmptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalCapacity = useMemo(() => stadiums.reduce((sum, stadium) => sum + stadium.capacity, 0), [stadiums]);
  const totalSectors = useMemo(() => stadiums.reduce((sum, stadium) => sum + stadium.sectors.length, 0), [stadiums]);

  const stadiumSeatCount = useMemo(() => {
    const rows = parseRows(draft.rowsText);
    const columns = Number(draft.columns) || 0;
    return rows.length * columns;
  }, [draft.rowsText, draft.columns]);

  const sectorsCapacitySum = useMemo(
    () => draft.sectors.reduce((sum, sector) => sum + (Number(sector.capacity) || 0), 0),
    [draft.sectors],
  );

  const loadStadiums = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getAdminStadiums(token);
      setStadiums(response.stadiums);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los estadios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadStadiums();
    // Solo debe recargar cuando cambie el token o el rol del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  function updateField<K extends keyof Omit<StadiumDraft, 'sectors'>>(field: K, value: StadiumDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateSector(key: string, patch: Partial<SectorDraft>) {
    setDraft((current) => ({
      ...current,
      sectors: current.sectors.map((sector) => (sector.key === key ? { ...sector, ...patch } : sector)),
    }));
  }

  function addSector() {
    setDraft((current) => ({ ...current, sectors: [...current.sectors, createEmptySector()] }));
  }

  function removeSector(key: string) {
    setDraft((current) =>
      current.sectors.length > 1 ? { ...current, sectors: current.sectors.filter((sector) => sector.key !== key) } : current,
    );
  }

  function resetDraft() {
    setDraft(createEmptyDraft());
  }

  // Valida el borrador con las mismas reglas que aplica el backend y arma el
  // payload para POST /api/admin/stadiums. Si algo no cuadra, muestra una
  // alerta explicando qué corregir y devuelve null (no se envía nada).
  function buildPayload(): AdminStadiumInput | null {
    const name = draft.name.trim();
    const city = draft.city.trim();
    const capacity = Number(draft.capacity);
    const columns = Number(draft.columns);
    const rows = parseRows(draft.rowsText);

    if (!name || !city || !capacity || capacity < 1 || !columns || columns < 1 || rows.length === 0) {
      Alert.alert('Datos incompletos', 'Completa nombre, ciudad, capacidad y el diseño de asientos del estadio.');
      return null;
    }

    if (rows.length * columns < capacity) {
      Alert.alert('Diseño insuficiente', `El aforo calculado (${rows.length * columns}) es menor a la capacidad indicada (${capacity}).`);
      return null;
    }

    if (draft.sectors.length === 0) {
      Alert.alert('Faltan sectores', 'Agrega al menos un sector.');
      return null;
    }

    const seenCodes = new Set<string>();
    const sectors: AdminStadiumInput['sectors'] = [];

    for (const sector of draft.sectors) {
      const sectorName = sector.name.trim();
      const sectorCode = sector.code.trim().toUpperCase();
      const sectorCapacity = Number(sector.capacity);
      const sectorPrice = Number(sector.price);
      const sectorColumns = Number(sector.columns);
      const sectorRows = parseRows(sector.rowsText);

      if (!sectorName || !sectorCode || !sectorCapacity || sectorCapacity < 1 || !sectorPrice || sectorPrice <= 0 || !sectorColumns || sectorColumns < 1 || sectorRows.length === 0) {
        Alert.alert('Datos incompletos', `Completa todos los campos del sector "${sectorName || sectorCode || 'sin nombre'}".`);
        return null;
      }

      if (seenCodes.has(sectorCode)) {
        Alert.alert('Código repetido', `El código "${sectorCode}" ya se usó en otro sector.`);
        return null;
      }
      seenCodes.add(sectorCode);

      if (sectorRows.length * sectorColumns < sectorCapacity) {
        Alert.alert('Diseño insuficiente', `El sector "${sectorName}" tiene un aforo calculado (${sectorRows.length * sectorColumns}) menor a su capacidad (${sectorCapacity}).`);
        return null;
      }

      sectors.push({
        name: sectorName,
        code: sectorCode,
        capacity: sectorCapacity,
        price: sectorPrice,
        seatLayout: { rows: sectorRows, columns: sectorColumns },
      });
    }

    const totalSectorCapacity = sectors.reduce((sum, sector) => sum + sector.capacity, 0);
    if (totalSectorCapacity !== capacity) {
      Alert.alert('Capacidad no coincide', `La suma de la capacidad de los sectores (${totalSectorCapacity}) debe ser igual a la capacidad total del estadio (${capacity}).`);
      return null;
    }

    return {
      name,
      city,
      capacity,
      imageUrl: draft.imageUrl.trim() || null,
      seatLayout: { rows, columns },
      sectors,
    };
  }

  async function save() {
    if (!token) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const response = await createAdminStadium(token, payload);
      setStadiums((current) => [response.stadium, ...current]);
      resetDraft();
      Alert.alert('Estadio creado', 'La sede ya está disponible para programar partidos.');
    } catch (saveError) {
      Alert.alert('No se pudo crear el estadio', saveError instanceof Error ? saveError.message : 'Revisa que la capacidad coincida con los sectores.');
    } finally {
      setSaving(false);
    }
  }

  return {
    isAdmin,
    stadiums,
    draft,
    loading,
    saving,
    error,
    totalCapacity,
    totalSectors,
    stadiumSeatCount,
    sectorsCapacitySum,
    loadStadiums,
    updateField,
    updateSector,
    addSector,
    removeSector,
    save,
  };
}
