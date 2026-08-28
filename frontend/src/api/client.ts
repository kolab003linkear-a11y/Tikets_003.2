import { Platform } from 'react-native';

const defaultApiUrl = Platform.OS === 'web' ? 'http://localhost:4000' : 'http://192.168.100.8:4000';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl).replace(/\/$/, '');

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
      movie: { title: string };
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
  movie: { id: string; title: string };
  room: { id: string; name: string; capacity: number };
};

export type AdminShowtimeInput = {
  movieId: string;
  roomId: string;
  startTime: string;
  price: number;
  availableSeats?: number;
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
  homeTeam: string;
  awayTeam: string;
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

export function getMatches() {
  return request<{ matches: StadiumMatch[] }>('/api/matches');
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

export function register(email: string, password: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role: 'CLIENT' }),
  });
}

export function createReservation(token: string, userId: string, showtimeId: string, seatNumbers: string[]) {
  return request<ReservationResponse>('/api/reservations/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, showtimeId, seatNumbers }),
  });
}

export function confirmDemoPayment(token: string, reservationId: string) {
  return request<PaymentResponse>('/api/payments/demo-confirm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reservationId }),
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

export { API_BASE_URL };
