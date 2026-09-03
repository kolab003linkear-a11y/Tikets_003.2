import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AdminTeamInput, createAdminTeam, deleteAdminTeam, getTeams, Team, updateAdminTeam } from '../api/client';

// ---------------------------------------------------------------------------
// Controlador del módulo "Equipos" (arquitectura Vista-Controlador).
// Toda la lógica (estado, validaciones, llamadas a la API) vive aquí;
// `AdminTeamsScreen.tsx` solo dibuja la interfaz.
// ---------------------------------------------------------------------------

export type TeamDraft = {
  name: string;
  city: string;
  logoUrl: string;
};

const emptyDraft: TeamDraft = { name: '', city: '', logoUrl: '' };

export function useAdminTeamsController() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [teams, setTeams] = useState<Team[]>([]);
  const [draft, setDraft] = useState<TeamDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const teamsWithLogo = useMemo(() => teams.filter((team) => Boolean(team.logoUrl)).length, [teams]);

  // GET /api/teams es público (no requiere token), pero solo se consulta
  // desde esta pantalla de administrador.
  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await getTeams();
      setTeams(response.teams);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los equipos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function updateDraft<K extends keyof TeamDraft>(key: K, value: TeamDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startEditing(team: Team) {
    setEditingId(team.id);
    setDraft({ name: team.name, city: team.city ?? '', logoUrl: team.logoUrl ?? '' });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function buildPayload(): AdminTeamInput | null {
    const name = draft.name.trim();
    if (!name) {
      Alert.alert('Datos incompletos', 'El nombre del equipo es obligatorio.');
      return null;
    }
    return {
      name,
      city: draft.city.trim() || null,
      logoUrl: draft.logoUrl.trim() || null,
    };
  }

  async function save() {
    if (!token) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const response = editingId
        ? await updateAdminTeam(token, editingId, payload)
        : await createAdminTeam(token, payload);
      setTeams((current) =>
        editingId ? current.map((team) => (team.id === editingId ? response.team : team)) : [response.team, ...current],
      );
      resetForm();
      Alert.alert('Equipo guardado', 'Ya está disponible para asignarlo a un partido.');
    } catch (saveError) {
      Alert.alert('No se pudo guardar', saveError instanceof Error ? saveError.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(team: Team) {
    Alert.alert('Eliminar equipo', `¿Eliminar "${team.name}"? Esto podría afectar partidos que ya lo usan.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void remove(team.id) },
    ]);
  }

  async function remove(teamId: string) {
    if (!token) return;
    setDeletingId(teamId);
    try {
      await deleteAdminTeam(token, teamId);
      setTeams((current) => current.filter((team) => team.id !== teamId));
      if (editingId === teamId) resetForm();
    } catch (deleteError) {
      Alert.alert(
        'No se pudo eliminar',
        deleteError instanceof Error ? deleteError.message : 'Puede que el equipo tenga partidos asociados.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return {
    isAdmin,
    teams,
    draft,
    editingId,
    loading,
    saving,
    deletingId,
    error,
    teamsWithLogo,
    loadTeams,
    updateDraft,
    startEditing,
    resetForm,
    save,
    confirmRemove,
  };
}
