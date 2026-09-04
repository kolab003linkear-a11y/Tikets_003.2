import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AdminMatch, AdminStadium, getAdminMatches, getAdminStadiums, getTeams, Team } from '../api/client';

// ---------------------------------------------------------------------------
// Controlador del "Dashboard" dentro del módulo Estadios (arquitectura
// Vista-Controlador). Trae partidos + estadios + equipos (igual que hace
// AdminMatchesScreen.controller.ts) solo para calcular un resumen: no
// comparte estado con las otras pestañas, cada una sigue siendo dueña de
// sus propios datos.
// ---------------------------------------------------------------------------

export function useAdminStadiumsDashboardController() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [stadiums, setStadiums] = useState<AdminStadium[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const stats = useMemo(() => {
    const liveMatches = matches.filter((match) => match.status === 'LIVE').length;
    const upcomingMatches = matches.filter((match) => match.status === 'SCHEDULED').length;
    const ticketsSold = matches.reduce((sum, match) => sum + (match._count?.tickets ?? 0), 0);
    const totalCapacity = stadiums.reduce((sum, stadium) => sum + (stadium.capacity ?? 0), 0);
    const totalSectors = stadiums.reduce((sum, stadium) => sum + stadium.sectors.length, 0);
    return {
      totalStadiums: stadiums.length,
      totalTeams: teams.length,
      totalMatches: matches.length,
      liveMatches,
      upcomingMatches,
      ticketsSold,
      totalCapacity,
      totalSectors,
    };
  }, [matches, stadiums, teams]);

  const nextMatches = useMemo(
    () =>
      matches
        .filter((match) => match.status === 'SCHEDULED' || match.status === 'LIVE')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5),
    [matches],
  );

  return { isAdmin, loading, error, stats, nextMatches, loadAll };
}
