import { Platform } from 'react-native';

function resolveDefaultApiUrl() {
  if (Platform.OS === 'web') return 'http://localhost:4001';
  if (Platform.OS === 'android') return 'http://10.0.2.2:4001';
  if (Platform.OS === 'ios') return 'http://localhost:4001';
  return 'http://localhost:4001';
}

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? resolveDefaultApiUrl()).replace(/\/$/, '');

export type CatalogShowtime = {
  id: string;
  startTime: string;
  price: number | string;
  availableSeats: number;
  occupiedSeats: string[];
  room: {
    id: string;
    name: string;
    capacity: number;
    seatLayout: unknown;
  };
};

export type CatalogMovie = {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  category: 'CINE' | 'TEATRO' | 'CONCIERTO';
  posterUrl: string;
  trailerUrl: string | null;
  rating: number | string | null;
  status: 'NOW_SHOWING' | 'COMING_SOON';
  showtimes: CatalogShowtime[];
};

export type CatalogResponse = {
  movies: CatalogMovie[];
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: 'CLIENT' | 'ADMIN' | 'SCANNER';
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type ModuleKey = 'catalog' | 'events' | 'stadiums' | 'parking' | 'buses' | 'assistant';
export type ModuleSettings = Record<ModuleKey, boolean>;

export type ReservationResponse = {
  success: boolean;
  reservation: {
    id: string;
    expiresAt: string | null;
  };
  tickets: Array<{
    id: string;
    seatNumber: string;
    qrCodeHash: string;
  }>;
};

export type PaymentResponse = {
  success: boolean;
  mode: 'demo' | 'stripe' | 'payphone';
  reservation: {
    id: string;
    status: 'PAID';
    tickets: Array<{
      id: string;
      qrCodeHash: string;
      seatNumber: string;
    }>;
    showtime: {
      startTime: string;
      movieEvent: { title: string };
      room: { name: string };
    };
  };
};

export type CancelReservationResponse = {
  success: boolean;
  cancelled: boolean;
  message?: string;
  reservation: {
    id: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
  };
};

export type TicketDetails = {
  id: string;
  seatNumber: string;
  status: 'VALID' | 'USED' | 'EXPIRED';
  createdAt: string;
  usedAt: string | null;
  qrPayload: string;
  reservationId: string;
  reservationStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  event: { title: string; startTime: string; room: string };
};

export type AdminEvent = {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  category: 'CINE' | 'TEATRO' | 'CONCIERTO';
  posterUrl: string;
  trailerUrl: string | null;
  rating: number | string | null;
  status: 'NOW_SHOWING' | 'COMING_SOON';
  _count?: { showtimes: number };
};

export type AdminEventInput = Omit<AdminEvent, 'id' | '_count'>;

export type AdminRoom = {
  id: string;
  name: string;
  capacity: number;
  seatLayout: { rows: string[]; columns: number };
  _count?: { showtimes: number };
};

export type AdminRoomInput = Omit<AdminRoom, 'id' | '_count'>;

export type AdminShowtime = {
  id: string;
  startTime: string;
  price: number | string;
  availableSeats: number;
  movieEvent: { id: string; title: string };
  room: { id: string; name: string; capacity: number };
};

export type AdminShowtimeInput = {
  movieId: string;
  roomId: string;
  startTime: string;
  price: number;
  availableSeats?: number;
};

export type Team = {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
};

export type AdminTeamInput = {
  name: string;
  city?: string | null;
  logoUrl?: string | null;
};

export type StadiumSector = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  price: number | string;
  seatLayout: { rows: string[]; columns: number };
  occupiedSeats?: string[];
};

export type StadiumMatch = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  stadium: { id: string; name: string; city: string; capacity: number; imageUrl?: string | null; sectors: StadiumSector[] };
  _count?: { tickets: number };
};

export type StadiumTicketResponse = {
  ticket: { id: string; qrPayload: string; status: 'VALID' | 'USED' | 'EXPIRED'; seatNumber: string; sector: string; match: StadiumMatch };
};

export type AdminStadium = {
  id: string;
  name: string;
  city: string;
  capacity: number;
  imageUrl?: string | null;
  sectors: StadiumSector[];
  _count?: { matches: number };
};

export type AdminStadiumInput = {
  name: string;
  city: string;
  capacity: number;
  imageUrl?: string | null;
  seatLayout: { rows: string[]; columns: number };
  sectors: Array<{ name: string; code: string; capacity: number; price: number; seatLayout: { rows: string[]; columns: number } }>;
};

export type AdminMatch = {
  id: string;
  stadiumId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  stadium: { id: string; name: string; city: string };
  homeTeam: Team;
  awayTeam: Team;
  _count?: { tickets: number; sectorPrices: number };
};

// Precio de un sector de estadio para UN partido en concreto (módulo
// "Precios por partido"). matchPrice es null cuando el admin no ha
// personalizado ese sector todavía y por eso effectivePrice = basePrice.
export type MatchSectorPriceEntry = {
  sectorId: string;
  sectorName: string;
  sectorCode: string;
  basePrice: number | string;
  matchPrice: number | string | null;
  effectivePrice: number | string;
};

export type MatchSectorPriceInput = {
  sectorId: string;
  // null = quitar el precio personalizado y volver a usar el precio base del sector.
  price: number | null;
};

export type AdminMatchPricesResponse = {
  matchId: string;
  stadiumId: string;
  prices: MatchSectorPriceEntry[];
};

export type AdminMatchInput = {
  stadiumId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status?: AdminMatch['status'];
  // Precios por sector definidos junto con el partido (crear o editar).
  // Opcional: si se omite, todos los sectores venden al precio base.
  sectorPrices?: MatchSectorPriceInput[];
};

export type AdminMatchSaveResponse = { match: AdminMatch; prices: MatchSectorPriceEntry[] };

export type ParkingLot = {
  id: string;
  name: string;
  address: string;
  city: string;
  totalSpaces: number;
  price: number | string;
  operator: string;
  openingHours: string;
  terminalName: string | null;
  accessMode: 'QR' | 'TARJETA' | 'TICKET';
  vehicleTypes: string[];
  reservedSpaces?: number;
  availableSpaces?: number;
  reservedSpaceNumbers?: number[];
  availabilityDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  _count?: { tickets: number };
  spaces?: ParkingSpace[];
};

export type ParkingSpace = {
  id: string;
  parkingId: string;
  spaceNumber: number;
  floor: number;
  code: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'CLOSED';
  occupied?: boolean;
};

export type AdminParkingDashboard = {
  parking: ParkingLot[];
  projectedRevenue: number;
  finalizedRevenue: number;
  demandByHour: Array<{ hour: number; count: number }>;
  revenueDate: string;
  updatedAt: string;
};

export type ParkingTicketResponse = {
  ticket: { id: string; spaceNumber: number; date: string; createdAt?: string; status: 'VALID' | 'USED' | 'EXPIRED'; qrPayload: string; parking: ParkingLot };
};

export type AdminParkingInput = Omit<ParkingLot, 'id' | '_count' | 'operator' | 'openingHours' | 'terminalName' | 'accessMode' | 'vehicleTypes'> & { operator?: string; openingHours?: string; terminalName?: string | null; accessMode?: ParkingLot['accessMode']; vehicleTypes?: string[] };

export type AdminParkingSpaceInput = { spaceNumber: number; floor?: number; code?: string; status?: ParkingSpace['status'] };

export type BusRoute = {
  id: string;
  origin: string;
  destination: string;
  operator: string;
  originTerminal: 'QUITUMBE' | 'CARCELEN';
  status: 'ACTIVE' | 'INACTIVE';
  _count?: { trips: number };
  trips?: BusTrip[];
};

export type BusTrip = {
  id: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string | null;
  price: number | string;
  totalSeats: number;
  availableSeats?: number;
  boardingPlatform: string | null;
  baggageInfo: string | null;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  route?: BusRoute;
  _count?: { tickets: number };
  occupiedSeats?: number[];
};

export type AdminBusRouteInput = Omit<BusRoute, 'id' | '_count' | 'trips' | 'originTerminal'> & { originTerminal?: BusRoute['originTerminal'] };
export type AdminBusTripInput = Omit<BusTrip, 'id' | '_count' | 'route' | 'occupiedSeats' | 'boardingPlatform' | 'baggageInfo'> & { boardingPlatform?: string | null; baggageInfo?: string | null };
export type BusTicketResponse = { ticket: { id: string; seatNumber: number; status: 'VALID' | 'USED' | 'EXPIRED'; qrPayload: string; trip: BusTrip & { route: BusRoute } } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `Error ${response.status} al consultar el servidor.`;
    throw new Error(message);
  }

  return payload as T;
}

export function getCatalog() {
  return request<CatalogResponse>('/api/catalog');
}

export function getModules() {
  return request<{ modules: ModuleSettings }>('/api/modules');
}

export function getAdminModules(token: string) {
  return request<{ modules: ModuleSettings }>('/api/admin/modules', { headers: { Authorization: `Bearer ${token}` } });
}

export function updateAdminModule(token: string, moduleKey: ModuleKey, enabled: boolean) {
  return request<{ modules: ModuleSettings }>(`/api/admin/modules/${moduleKey}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ enabled }) });
}

export function createAdminUser(token: string, payload: { email: string; password: string; fullName: string; phone?: string }) {
  return request<{ user: AuthUser }>('/api/admin/users', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}

export function getMatches() {
  return request<{ matches: StadiumMatch[] }>('/api/matches');
}

export function getTeams() {
  return request<{ teams: Team[] }>('/api/teams');
}

// Equipos favoritos del cliente (pantalla de Estadios). El backend ya
// vinculaba User<->Team desde el modelo UserFavoriteTeam; esto solo conecta
// el front a esos endpoints existentes.
export function getFavoriteTeams(token: string) {
  return request<{ teams: Team[] }>('/api/me/favorite-teams', { headers: { Authorization: `Bearer ${token}` } });
}

export function addFavoriteTeam(token: string, teamId: string) {
  return request<{ success: boolean }>('/api/me/favorite-teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ teamId }),
  });
}

export function removeFavoriteTeam(token: string, teamId: string) {
  return request<{ success: boolean }>(`/api/me/favorite-teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createAdminTeam(token: string, team: AdminTeamInput) {
  return request<{ team: Team }>('/api/admin/teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(team),
  });
}

export function updateAdminTeam(token: string, teamId: string, team: AdminTeamInput) {
  return request<{ team: Team }>(`/api/admin/teams/${teamId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(team),
  });
}

export function deleteAdminTeam(token: string, teamId: string) {
  return request<{ success: boolean }>(`/api/admin/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createMatchTicket(token: string, matchId: string, sectorId: string, seatNumber: string) {
  return request<StadiumTicketResponse>(`/api/matches/${matchId}/tickets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sectorId, seatNumber }),
  });
}
export function getAdminStadiums(token: string) {
  return request<{ stadiums: AdminStadium[] }>('/api/admin/stadiums', { headers: { Authorization: `Bearer ${token}` } });
}

export function createAdminStadium(token: string, stadium: AdminStadiumInput) {
  return request<{ stadium: AdminStadium }>('/api/admin/stadiums', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(stadium),
  });
}

export function getAdminMatches(token: string) {
  return request<{ matches: AdminMatch[] }>('/api/admin/matches', { headers: { Authorization: `Bearer ${token}` } });
}

export function createAdminMatch(token: string, match: AdminMatchInput) {
  return request<AdminMatchSaveResponse>('/api/admin/matches', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(match),
  });
}

export function updateAdminMatch(token: string, matchId: string, match: AdminMatchInput) {
  return request<AdminMatchSaveResponse>(`/api/admin/matches/${matchId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(match),
  });
}

export function getAdminMatchPrices(token: string, matchId: string) {
  return request<AdminMatchPricesResponse>(`/api/admin/matches/${matchId}/prices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminMatchPrices(token: string, matchId: string, prices: MatchSectorPriceInput[]) {
  return request<AdminMatchPricesResponse>(`/api/admin/matches/${matchId}/prices`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prices }),
  });
}

export function getParking(date?: string) { return request<{ parking: ParkingLot[] }>(`/api/parking${date ? `?date=${encodeURIComponent(date)}` : ''}`); }

export function createParkingTicket(token: string, parkingId: string, spaceNumber: number, date: string) {
  return request<ParkingTicketResponse>(`/api/parking/${parkingId}/tickets`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ spaceNumber, date }) });
}

export function payParkingTicket(token: string, ticketId: string, paymentMethod: 'CARD' | 'GOOGLE_PAY' | 'APPLE_PAY' | 'PAYPAL' | 'CASH') {
  return request<{ success: boolean; ticket: ParkingTicketResponse['ticket']; paymentMethod: string }>(`/api/parking/tickets/${ticketId}/pay`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ paymentMethod }) });
}

export function getBuses(terminal?: string, destination?: string, operator?: string) {
  const params = new URLSearchParams();
  if (terminal?.trim()) params.set('terminal', terminal.trim().toUpperCase());
  if (destination?.trim()) params.set('destination', destination.trim());
  if (operator?.trim()) params.set('operator', operator.trim());
  const query = params.toString();
  return request<{ routes: BusRoute[] }>(`/api/buses${query ? `?${query}` : ''}`);
}

export function createBusTicket(token: string, tripId: string, seatNumber: number) {
  return request<BusTicketResponse>(`/api/bus-trips/${tripId}/tickets`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ seatNumber }) });
}

export function getAdminParking(token: string) { return request<AdminParkingDashboard>('/api/admin/parking', { headers: { Authorization: `Bearer ${token}` } }); }
export function createAdminParking(token: string, parking: AdminParkingInput) { return request<{ parking: ParkingLot }>('/api/admin/parking', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(parking) }); }
export function updateAdminParking(token: string, parkingId: string, parking: AdminParkingInput) { return request<{ parking: ParkingLot }>(`/api/admin/parking/${parkingId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(parking) }); }
export function deleteAdminParking(token: string, parkingId: string) { return request<{ success: boolean }>(`/api/admin/parking/${parkingId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); }
export function createAdminParkingSpace(token: string, parkingId: string, space: AdminParkingSpaceInput) { return request<{ space: ParkingSpace }>(`/api/admin/parking/${parkingId}/spaces`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(space) }); }
export function updateAdminParkingSpace(token: string, parkingId: string, spaceId: string, status: ParkingSpace['status']) { return request<{ space: ParkingSpace }>(`/api/admin/parking/${parkingId}/spaces/${spaceId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }); }

export function getAdminRoutes(token: string) { return request<{ routes: BusRoute[] }>('/api/admin/bus-routes', { headers: { Authorization: `Bearer ${token}` } }); }
export function createAdminRoute(token: string, route: AdminBusRouteInput) { return request<{ route: BusRoute }>('/api/admin/bus-routes', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(route) }); }
export function updateAdminRoute(token: string, routeId: string, route: AdminBusRouteInput) { return request<{ route: BusRoute }>(`/api/admin/bus-routes/${routeId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(route) }); }
export function getAdminTrips(token: string) { return request<{ trips: BusTrip[] }>('/api/admin/bus-trips', { headers: { Authorization: `Bearer ${token}` } }); }
export function createAdminTrip(token: string, trip: AdminBusTripInput) { return request<{ trip: BusTrip }>('/api/admin/bus-trips', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(trip) }); }
export function updateAdminTrip(token: string, tripId: string, trip: AdminBusTripInput) { return request<{ trip: BusTrip }>(`/api/admin/bus-trips/${tripId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(trip) }); }

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function createGuestSession(email: string, fullName: string, phone: string) {
  return request<AuthResponse>('/api/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ email, fullName, phone }),
  });
}

export function register(email: string, password: string, fullName?: string, phone?: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, phone, role: 'CLIENT' }),
  });
}

export function createReservation(token: string, userId: string, showtimeId: string, seatNumbers: string[]) {
  return request<ReservationResponse>('/api/reservations/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, showtimeId, seatNumbers }),
  });
}

export function confirmDemoPayment(token: string, reservationId: string, paymentMethod: 'CARD' | 'GOOGLE_PAY' | 'APPLE_PAY' | 'PAYPAL' | 'CASH' = 'CARD') {
  return request<PaymentResponse>('/api/payments/demo-confirm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reservationId, paymentMethod }),
  });
}

export function cancelReservation(token: string, reservationId: string) {
  return request<CancelReservationResponse>(`/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type TicketValidationResponse = {
  valid: boolean;
  status: 'VALID' | 'USED' | 'EXPIRED' | 'INVALID';
  message: string;
  ticket?: {
    id: string;
    seatNumber: string;
    status?: 'VALID' | 'USED' | 'EXPIRED';
    usedAt?: string | null;
    reservationId: string;
    event?: {
      title: string;
      startTime: string;
      room: string;
    };
  };
};

export function validateTicket(token: string, qrCode: string) {
  return request<TicketValidationResponse>('/api/admin/tickets/validate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ qrCode }),
  });
}

export function getMyTickets(token: string) {
  return request<{ tickets: TicketDetails[] }>('/api/tickets', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAdminEvents(token: string) {
  return request<{ events: AdminEvent[] }>('/api/admin/events', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createAdminEvent(token: string, event: AdminEventInput) {
  return request<{ event: AdminEvent }>('/api/admin/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  });
}

export function updateAdminEvent(token: string, eventId: string, event: AdminEventInput) {
  return request<{ event: AdminEvent }>(`/api/admin/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  });
}

export function getAdminRooms(token: string) {
  return request<{ rooms: AdminRoom[] }>('/api/admin/rooms', { headers: { Authorization: `Bearer ${token}` } });
}

export function createAdminRoom(token: string, room: AdminRoomInput) {
  return request<{ room: AdminRoom }>('/api/admin/rooms', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(room),
  });
}

export function updateAdminRoom(token: string, roomId: string, room: AdminRoomInput) {
  return request<{ room: AdminRoom }>(`/api/admin/rooms/${roomId}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(room),
  });
}

export function getAdminShowtimes(token: string) {
  return request<{ showtimes: AdminShowtime[] }>('/api/admin/showtimes', { headers: { Authorization: `Bearer ${token}` } });
}

export function createAdminShowtime(token: string, showtime: AdminShowtimeInput) {
  return request<{ showtime: AdminShowtime }>('/api/admin/showtimes', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(showtime),
  });
}

export function updateAdminShowtime(token: string, showtimeId: string, showtime: AdminShowtimeInput) {
  return request<{ showtime: AdminShowtime }>(`/api/admin/showtimes/${showtimeId}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(showtime),
  });
}

export function getMe(token: string) {
  return request<{ user: AuthUser }>('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateMe(token: string, profile: { email: string; fullName?: string; phone?: string }) {
  return request<{ user: AuthUser }>('/api/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(profile),
  });
}

