import { useState } from 'react';

// ---------------------------------------------------------------------------
// Controlador del hub "Estadios" (arquitectura Vista-Controlador). Es
// deliberadamente delgado: solo guarda qué pestaña interna está activa
// (Dashboard/Estadios/Equipos/Partidos). Cada pestaña sigue siendo dueña de
// sus propios datos a través de su propio controlador.
// ---------------------------------------------------------------------------

export type StadiumsHubTab = 'dashboard' | 'stadiums' | 'teams' | 'matches';

export function useAdminStadiumsHubController() {
  const [tab, setTab] = useState<StadiumsHubTab>('dashboard');
  return { tab, setTab };
}
