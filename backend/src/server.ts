import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, PrismaClient, ReservationStatus, StadiumTicketStatus, TicketStatus, UserRole, ParkingTicketStatus, BusTicketStatus, ParkingAccessMode, ParkingTicketMode, BusOriginTerminal } from '@prisma/client';
import { z } from 'zod';
import { createHash } from 'crypto';
import { writeLog } from './logger';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const nodeEnvironment = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnvironment === 'production';
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? (isProduction ? '' : 'tiKets-dev-secret');
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && (!jwtSecret || jwtSecret === 'tiKets-dev-secret')) {
  throw new Error('JWT_SECRET must be configured with a production secret.');
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    writeLog('INFO', `${req.method} ${req.originalUrl} ${res.statusCode}`, { durationMs: Date.now() - startedAt });
  });
  next();
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  role: z.enum(['CLIENT', 'ADMIN', 'SCANNER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const guestSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
});

const reservationSchema = z.object({
  showtimeId: z.string().min(1),
  userId: z.string().min(1),
  seatNumbers: z.array(z.string().min(1)).min(1).max(12),
});

const webhookSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed']),
  reservationId: z.string().min(1),
});

const paymentConfirmationSchema = z.object({
  reservationId: z.string().min(1),
});

const profileSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

const eventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  synopsis: z.string().trim().min(1).max(2000),
  duration: z.coerce.number().int().min(1).max(600),
  category: z.enum(['CINE', 'TEATRO', 'CONCIERTO']),
  posterUrl: z.string().trim().url(),
  trailerUrl: z.string().trim().url().nullable().optional(),
  rating: z.coerce.number().min(0).max(10).nullable().optional(),
  status: z.enum(['NOW_SHOWING', 'COMING_SOON']),
});

const roomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(500),
  seatLayout: z.object({
    rows: z.array(z.string().trim().min(1).max(3)).min(1).max(26),
    columns: z.coerce.number().int().min(1).max(30),
  }),
});

const showtimeSchema = z.object({
  movieId: z.string().min(1),
  roomId: z.string().min(1),
  startTime: z.coerce.date(),
  price: z.coerce.number().positive().max(10000),
  availableSeats: z.coerce.number().int().min(0).optional(),
});

const stadiumSectorSchema = z.object({
  name: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(12).transform((value) => value.toUpperCase()),
  capacity: z.coerce.number().int().min(1).max(100000),
  price: z.coerce.number().positive().max(10000),
  seatLayout: z.object({
    rows: z.array(z.string().trim().min(1).max(3)).min(1).max(100),
    columns: z.coerce.number().int().min(1).max(100),
  }),
});

const stadiumSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(100000),
  imageUrl: z.string().trim().url().nullable().optional(),
  seatLayout: z.object({
    rows: z.array(z.string().trim().min(1).max(3)).min(1).max(100),
    columns: z.coerce.number().int().min(1).max(100),
  }),
  sectors: z.array(stadiumSectorSchema).min(1).max(100),
});

const matchSchema = z.object({
  stadiumId: z.string().min(1),
  homeTeam: z.string().trim().min(1).max(80),
  awayTeam: z.string().trim().min(1).max(80),
  startTime: z.coerce.date(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED']).optional(),
});

const stadiumTicketSchema = z.object({
  sectorId: z.string().min(1),
  seatNumber: z.string().trim().min(1).max(12),
});

const parkingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  totalSpaces: z.coerce.number().int().min(1).max(100000),
  price: z.coerce.number().nonnegative().max(10000),
  operator: z.string().trim().min(1).max(120).default('Operador demo TiKetSafe'),
  openingHours: z.string().trim().min(1).max(120).default('Horario demo por confirmar'),
  terminalName: z.string().trim().max(120).nullable().optional(),
  accessMode: z.enum(['QR', 'TARJETA', 'TICKET']).default('QR'),
  vehicleTypes: z.array(z.string().trim().min(1).max(40)).min(1).max(20).default(['AUTO']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const parkingTicketSchema = z.object({
  spaceNumber: z.coerce.number().int().min(1),
  date: z.coerce.date(),
  entryTime: z.coerce.date().nullable().optional(),
});

const busRouteSchema = z.object({
  origin: z.string().trim().min(1).max(100),
  destination: z.string().trim().min(1).max(100),
  operator: z.string().trim().min(1).max(120),
  originTerminal: z.enum(['QUITUMBE', 'CARCELEN']).default('QUITUMBE'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const busTripSchema = z.object({
  routeId: z.string().min(1),
  departureTime: z.coerce.date(),
  arrivalTime: z.coerce.date().nullable().optional(),
  boardingPlatform: z.string().trim().max(40).nullable().optional().default(null),
  baggageInfo: z.string().trim().max(500).nullable().optional().default(null),
  price: z.coerce.number().positive().max(10000),
  totalSeats: z.coerce.number().int().min(1).max(1000),
  status: z.enum(['SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED']).optional(),
});

const busTicketSchema = z.object({ seatNumber: z.coerce.number().int().min(1) });

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function signToken(payload: { sub: string; email: string; role: UserRole }) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Credential missing.', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, jwtSecret) as { sub: string; email: string; role: UserRole };
    (req as Request & { user?: { sub: string; email: string; role: UserRole } }).user = decoded;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

const normalizeSeats = (seats: string[]) => [...new Set(seats.map((seat) => seat.trim().toUpperCase()))].sort();

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Origin not allowed by CORS.'));
      }
    : true,
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'TiKetSafe-api', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    writeLog('ERROR', 'Database health check failed', error);
    next(new AppError('Database unavailable.', 503));
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: payload.fullName?.trim() || null,
        phone: payload.phone?.trim() || null,
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/guest', async (req, res, next) => {
  try {
    const payload = guestSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName: payload.fullName.trim(), phone: payload.phone.trim() },
      create: {
        email,
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        passwordHash: await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12),
        role: UserRole.CLIENT,
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });
    const token = signToken({ sub: user.id, email: user.email, role: existingUser?.role ?? user.role });
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });

    if (!user) throw new AppError('User not found.', 404);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/me', authMiddleware, async (req, res, next) => {
  try {
    const payload = profileSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const user = await prisma.user.update({
      where: { id: authenticatedUser.sub },
      data: {
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName?.trim() || null,
        phone: payload.phone?.trim() || null,
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });

    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/events', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage events.', 403);
    }

    const events = await prisma.movieEvent.findMany({
      include: { _count: { select: { showtimes: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ events });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/events', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage events.', 403);
    }

    const payload = eventSchema.parse(req.body);
    const event = await prisma.movieEvent.create({
      data: {
        ...payload,
        trailerUrl: payload.trailerUrl ?? null,
        rating: payload.rating ?? null,
      },
    });

    return res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/events/:eventId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage events.', 403);
    }

    const payload = eventSchema.parse(req.body);
    const event = await prisma.movieEvent.update({
      where: { id: req.params.eventId },
      data: {
        ...payload,
        trailerUrl: payload.trailerUrl ?? null,
        rating: payload.rating ?? null,
      },
    });

    return res.json({ event });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/rooms', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage rooms.', 403);
    const rooms = await prisma.room.findMany({
      include: { _count: { select: { showtimes: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json({ rooms });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/rooms', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage rooms.', 403);
    const payload = roomSchema.parse(req.body);
    if (payload.seatLayout.rows.length * payload.seatLayout.columns < payload.capacity) {
      throw new AppError('The seat layout cannot be smaller than the room capacity.', 400);
    }
    const room = await prisma.room.create({ data: payload });
    return res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/rooms/:roomId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage rooms.', 403);
    const payload = roomSchema.parse(req.body);
    if (payload.seatLayout.rows.length * payload.seatLayout.columns < payload.capacity) {
      throw new AppError('The seat layout cannot be smaller than the room capacity.', 400);
    }
    const room = await prisma.room.update({ where: { id: req.params.roomId }, data: payload });
    return res.json({ room });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/showtimes', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage showtimes.', 403);
    const showtimes = await prisma.showtime.findMany({
      include: { movie: { select: { id: true, title: true } }, room: { select: { id: true, name: true, capacity: true } } },
      orderBy: { startTime: 'asc' },
    });
    return res.json({ showtimes });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/showtimes', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage showtimes.', 403);
    const payload = showtimeSchema.parse(req.body);
    const room = await prisma.room.findUnique({ where: { id: payload.roomId } });
    if (!room) throw new AppError('Room not found.', 404);
    const movie = await prisma.movieEvent.findUnique({ where: { id: payload.movieId }, select: { id: true } });
    if (!movie) throw new AppError('Event not found.', 404);
    const availableSeats = payload.availableSeats ?? room.capacity;
    if (availableSeats > room.capacity) throw new AppError('Availability cannot exceed room capacity.', 400);
    const showtime = await prisma.showtime.create({ data: { ...payload, availableSeats } });
    return res.status(201).json({ showtime });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/showtimes/:showtimeId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage showtimes.', 403);
    const payload = showtimeSchema.parse(req.body);
    const room = await prisma.room.findUnique({ where: { id: payload.roomId } });
    if (!room) throw new AppError('Room not found.', 404);
    const availableSeats = payload.availableSeats ?? room.capacity;
    if (availableSeats > room.capacity) throw new AppError('Availability cannot exceed room capacity.', 400);
    const showtime = await prisma.showtime.update({ where: { id: req.params.showtimeId }, data: { ...payload, availableSeats } });
    return res.json({ showtime });
  } catch (error) {
    next(error);
  }
});

app.get('/api/stadiums', async (_req, res, next) => {
  try {
    const stadiums = await prisma.stadium.findMany({ include: { sectors: true }, orderBy: { name: 'asc' } });
    return res.json({ stadiums });
  } catch (error) {
    next(error);
  }
});

app.get('/api/matches', async (_req, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] } },
      include: {
        stadium: { include: { sectors: true } },
        tickets: { where: { status: { in: [StadiumTicketStatus.VALID, StadiumTicketStatus.USED] } }, select: { sectorId: true, seatNumber: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return res.json({ matches: matches.map(({ tickets, ...match }) => ({
      ...match,
      stadium: {
        ...match.stadium,
        sectors: match.stadium.sectors.map((sector) => ({
          ...sector,
          occupiedSeats: tickets.filter((ticket) => ticket.sectorId === sector.id).map((ticket) => ticket.seatNumber),
        })),
      },
    })) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/stadiums', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage stadiums.', 403);
    const stadiums = await prisma.stadium.findMany({ include: { sectors: true, _count: { select: { matches: true } } }, orderBy: { name: 'asc' } });
    return res.json({ stadiums });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/stadiums', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage stadiums.', 403);
    const payload = stadiumSchema.parse(req.body);
    const seatCount = payload.seatLayout.rows.length * payload.seatLayout.columns;
    const sectorCapacity = payload.sectors.reduce((total, sector) => total + sector.capacity, 0);
    if (seatCount < payload.capacity || sectorCapacity !== payload.capacity) throw new AppError('Stadium capacity and sectors must match the seat layout.', 400);
    const stadium = await prisma.stadium.create({ data: { name: payload.name, city: payload.city, capacity: payload.capacity, imageUrl: payload.imageUrl ?? null, seatLayout: payload.seatLayout, sectors: { create: payload.sectors } }, include: { sectors: true } });
    return res.status(201).json({ stadium });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/matches', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage matches.', 403);
    const matches = await prisma.match.findMany({ include: { stadium: true, _count: { select: { tickets: true } } }, orderBy: { startTime: 'asc' } });
    return res.json({ matches });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/matches', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage matches.', 403);
    const payload = matchSchema.parse(req.body);
    if (payload.homeTeam.toLowerCase() === payload.awayTeam.toLowerCase()) throw new AppError('Home and away teams must be different.', 400);
    const stadium = await prisma.stadium.findUnique({ where: { id: payload.stadiumId }, select: { id: true } });
    if (!stadium) throw new AppError('Stadium not found.', 404);
    const match = await prisma.match.create({ data: { ...payload, status: payload.status ?? 'SCHEDULED' }, include: { stadium: true } });
    return res.status(201).json({ match });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/matches/:matchId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage matches.', 403);
    const payload = matchSchema.parse(req.body);
    const match = await prisma.match.update({ where: { id: req.params.matchId }, data: { ...payload, status: payload.status ?? 'SCHEDULED' }, include: { stadium: true } });
    return res.json({ match });
  } catch (error) {
    next(error);
  }
});

app.post('/api/matches/:matchId/tickets', authMiddleware, async (req, res, next) => {
  try {
    const payload = stadiumTicketSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const account = await prisma.user.findUnique({ where: { id: authenticatedUser.sub }, select: { id: true, fullName: true, phone: true } });
    if (!account) throw new AppError('Your session is no longer valid. Please sign in again.', 401);
    const match = await prisma.match.findUnique({ where: { id: req.params.matchId }, include: { stadium: true } });
    if (!match || match.status === 'CANCELLED' || match.status === 'FINISHED') throw new AppError('Match is not available for ticket sales.', 409);
    const sector = await prisma.stadiumSector.findUnique({ where: { id: payload.sectorId } });
    if (!sector || sector.stadiumId !== match.stadiumId) throw new AppError('Sector does not belong to this stadium.', 400);
    const layout = sector.seatLayout as { rows?: unknown; columns?: unknown };
    const rows = Array.isArray(layout.rows) ? layout.rows.filter((row): row is string => typeof row === 'string') : [];
    const columns = typeof layout.columns === 'number' ? layout.columns : 0;
    const validSeats = new Set(rows.flatMap((row) => Array.from({ length: columns }, (_, index) => `${row}${index + 1}`)));
    const normalizedSeat = payload.seatNumber.toUpperCase();
    if (!validSeats.has(normalizedSeat)) throw new AppError('Seat is outside the selected sector.', 400);

    const existingTicket = await prisma.stadiumTicket.findUnique({
      where: { matchId_sectorId_seatNumber: { matchId: req.params.matchId, sectorId: payload.sectorId, seatNumber: normalizedSeat } },
      select: { id: true },
    });
    if (existingTicket) throw new AppError('This stadium seat is already taken for this match.', 409);

    const qrCodeHash = createHash('sha256').update(`${req.params.matchId}:${payload.sectorId}:${normalizedSeat}:${Date.now()}:${Math.random()}`).digest('hex');
    const ticket = await prisma.stadiumTicket.create({ data: { matchId: req.params.matchId, sectorId: payload.sectorId, userId: account.id, seatNumber: normalizedSeat, qrCodeHash }, include: { match: { include: { stadium: true } }, sector: true } });
    return res.status(201).json({ ticket: { id: ticket.id, qrPayload: `stadiumsafe:v1:${ticket.id}:${ticket.qrCodeHash}`, status: ticket.status, seatNumber: ticket.seatNumber, sector: ticket.sector.name, match: ticket.match } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/parking', async (_req, res, next) => {
  try {
    const requestedDate = _req.query.date ? new Date(String(_req.query.date)) : new Date();
    requestedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(requestedDate); nextDate.setDate(nextDate.getDate() + 1);
    const parking = await prisma.parkingLot.findMany({ where: { status: 'ACTIVE' }, include: { tickets: { where: { date: { gte: requestedDate, lt: nextDate }, status: { in: ['VALID', 'USED'] } }, select: { spaceNumber: true } } }, orderBy: { name: 'asc' } });
    return res.json({ parking: parking.map(({ tickets, ...item }) => ({ ...item, reservedSpaces: tickets.length, availableSpaces: Math.max(item.totalSpaces - tickets.length, 0), reservedSpaceNumbers: tickets.map((ticket) => ticket.spaceNumber), availabilityDate: requestedDate.toISOString() })) });
  } catch (error) { next(error); }
});

app.get('/api/buses', async (_req, res, next) => {
  try {
    const terminal = _req.query.terminal ? String(_req.query.terminal) : undefined;
    const destination = _req.query.destination ? String(_req.query.destination) : undefined;
    const operator = _req.query.operator ? String(_req.query.operator) : undefined;
    const routes = await prisma.busRoute.findMany({ where: { status: 'ACTIVE', originTerminal: terminal as BusOriginTerminal | undefined, destination: destination ? { contains: destination, mode: 'insensitive' } : undefined, operator: operator ? { contains: operator, mode: 'insensitive' } : undefined }, include: { trips: { where: { status: { not: 'CANCELLED' } }, include: { tickets: { where: { status: { in: ['VALID', 'USED'] } }, select: { seatNumber: true } } }, orderBy: { departureTime: 'asc' } } }, orderBy: { origin: 'asc' } });
    return res.json({ routes: routes.map(({ trips, ...route }) => ({ ...route, trips: trips.map(({ tickets, ...trip }) => ({ ...trip, occupiedSeats: tickets.map((ticket) => ticket.seatNumber), availableSeats: Math.max(trip.totalSeats - tickets.length, 0) })) })) });
  } catch (error) { next(error); }
});

app.get('/api/admin/parking', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking lots.', 403);
    return res.json({ parking: await prisma.parkingLot.findMany({ include: { _count: { select: { tickets: true } } }, orderBy: { name: 'asc' } }) });
  } catch (error) { next(error); }
});

app.post('/api/admin/parking', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking lots.', 403);
    const payload = parkingSchema.parse(req.body);
    return res.status(201).json({ parking: await prisma.parkingLot.create({ data: { ...payload, status: payload.status ?? 'ACTIVE' } }) });
  } catch (error) { next(error); }
});

app.patch('/api/admin/parking/:parkingId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking lots.', 403);
    const payload = parkingSchema.parse(req.body);
    return res.json({ parking: await prisma.parkingLot.update({ where: { id: req.params.parkingId }, data: { ...payload, status: payload.status ?? 'ACTIVE' } }) });
  } catch (error) { next(error); }
});

app.post('/api/parking/:parkingId/tickets', authMiddleware, async (req, res, next) => {
  try {
    const payload = parkingTicketSchema.parse(req.body);
    const user = (req as Request & { user: { sub: string } }).user;
    const parking = await prisma.parkingLot.findUnique({ where: { id: req.params.parkingId } });
    if (!parking || parking.status !== 'ACTIVE') throw new AppError('Parking lot is not available.', 409);
    if (payload.spaceNumber > parking.totalSpaces) throw new AppError('Space is outside this parking lot.', 400);
    const date = new Date(payload.date); date.setHours(0, 0, 0, 0);
    const qrCodeHash = createHash('sha256').update(`${parking.id}:${payload.spaceNumber}:${date.toISOString()}:${Date.now()}:${Math.random()}`).digest('hex');
    const ticket = await prisma.parkingTicket.create({ data: { parkingId: parking.id, userId: user.sub, spaceNumber: payload.spaceNumber, date, entryTime: payload.entryTime ?? null, ticketMode: parking.accessMode as ParkingTicketMode, entryMetadata: { demo: true, accessMode: parking.accessMode, operator: parking.operator, terminalName: parking.terminalName, date: date.toISOString() }, qrCodeHash }, include: { parking: true } });
    return res.status(201).json({ ticket: { id: ticket.id, spaceNumber: ticket.spaceNumber, date: ticket.date, status: ticket.status, qrPayload: `parkingsafe:v1:${ticket.id}:${ticket.qrCodeHash}`, parking: ticket.parking } });
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('Ese espacio ya está reservado para la fecha seleccionada.', 409)); next(error); }
});

app.get('/api/admin/bus-routes', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus routes.', 403);
    return res.json({ routes: await prisma.busRoute.findMany({ include: { _count: { select: { trips: true } } }, orderBy: { origin: 'asc' } }) });
  } catch (error) { next(error); }
});

app.post('/api/admin/bus-routes', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus routes.', 403);
    const payload = busRouteSchema.parse(req.body);
    return res.status(201).json({ route: await prisma.busRoute.create({ data: { ...payload, status: payload.status ?? 'ACTIVE' } }) });
  } catch (error) { next(error); }
});

app.patch('/api/admin/bus-routes/:routeId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus routes.', 403);
    const payload = busRouteSchema.parse(req.body);
    return res.json({ route: await prisma.busRoute.update({ where: { id: req.params.routeId }, data: { ...payload, status: payload.status ?? 'ACTIVE' } }) });
  } catch (error) { next(error); }
});

app.get('/api/admin/bus-trips', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus trips.', 403);
    return res.json({ trips: await prisma.busTrip.findMany({ include: { route: true, _count: { select: { tickets: true } } }, orderBy: { departureTime: 'asc' } }) });
  } catch (error) { next(error); }
});

app.post('/api/admin/bus-trips', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus trips.', 403);
    const payload = busTripSchema.parse(req.body);
    if (!(await prisma.busRoute.findUnique({ where: { id: payload.routeId }, select: { id: true } }))) throw new AppError('Bus route not found.', 404);
    return res.status(201).json({ trip: await prisma.busTrip.create({ data: { ...payload, arrivalTime: payload.arrivalTime ?? null, status: payload.status ?? 'SCHEDULED' }, include: { route: true } }) });
  } catch (error) { next(error); }
});

app.patch('/api/admin/bus-trips/:tripId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus trips.', 403);
    const payload = busTripSchema.parse(req.body);
    return res.json({ trip: await prisma.busTrip.update({ where: { id: req.params.tripId }, data: { ...payload, arrivalTime: payload.arrivalTime ?? null, status: payload.status ?? 'SCHEDULED' }, include: { route: true } }) });
  } catch (error) { next(error); }
});

app.post('/api/bus-trips/:tripId/tickets', authMiddleware, async (req, res, next) => {
  try {
    const payload = busTicketSchema.parse(req.body);
    const user = (req as Request & { user: { sub: string } }).user;
    const trip = await prisma.busTrip.findUnique({ where: { id: req.params.tripId }, include: { route: true } });
    if (!trip || ['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(trip.status)) throw new AppError('Bus trip is not available for ticket sales.', 409);
    if (payload.seatNumber > trip.totalSeats) throw new AppError('Seat is outside this bus.', 400);
    const qrCodeHash = createHash('sha256').update(`${trip.id}:${payload.seatNumber}:${Date.now()}:${Math.random()}`).digest('hex');
    const ticket = await prisma.busTicket.create({ data: { tripId: trip.id, userId: user.sub, seatNumber: payload.seatNumber, qrCodeHash }, include: { trip: { include: { route: true } } } });
    return res.status(201).json({ ticket: { id: ticket.id, seatNumber: ticket.seatNumber, status: ticket.status, qrPayload: `bussafe:v1:${ticket.id}:${ticket.qrCodeHash}`, trip: ticket.trip } });
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('Ese asiento ya fue reservado para este viaje.', 409)); next(error); }
});

app.get('/api/catalog', async (req, res, next) => {
  try {
    const category = String(req.query.category ?? 'ALL');
    const dateParam = req.query.date ? new Date(String(req.query.date)) : undefined;

    const where: Record<string, any> = {};
    if (category !== 'ALL') {
      where.category = category;
    }

    if (dateParam) {
      const start = new Date(dateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59, 999);
      where.showtimes = {
        some: {
          startTime: {
            gte: start,
            lte: end,
          },
        },
      };
    }

    const movies = await prisma.movieEvent.findMany({
      where,
      include: {
        showtimes: {
          include: {
            room: true,
            reservations: {
              where: {
                status: {
                  in: [ReservationStatus.PENDING, ReservationStatus.PAID],
                },
              },
              include: {
                tickets: {
                  select: { seatNumber: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      movies: movies.map((movie) => ({
        ...movie,
        showtimes: movie.showtimes.map((showtime) => ({
          ...showtime,
          occupiedSeats: showtime.reservations.flatMap((reservation) =>
            reservation.tickets.map((ticket) => ticket.seatNumber),
          ),
          reservations: undefined,
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservations/create', authMiddleware, async (req, res, next) => {
  try {
    const payload = reservationSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const seatNumbers = normalizeSeats(payload.seatNumbers);

    const account = await prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      select: { id: true, fullName: true, phone: true },
    });
    if (!account) {
      throw new AppError('Your session is no longer valid. Please sign in again.', 401);
    }

    const result = await prisma.$transaction(async (tx) => {
      const showtime = await tx.showtime.findUnique({
        where: { id: payload.showtimeId },
        include: { room: true },
      });

      if (!showtime) {
        throw new AppError('Selected showtime was not found.', 404);
      }

      const seatLayout = showtime.room.seatLayout as { rows?: unknown; columns?: unknown };
      const rows = Array.isArray(seatLayout.rows) ? seatLayout.rows.filter((row): row is string => typeof row === 'string') : [];
      const columns = typeof seatLayout.columns === 'number' ? seatLayout.columns : 0;
      const validSeats = new Set(rows.flatMap((row) => Array.from({ length: columns }, (_, index) => `${row}${index + 1}`)));
      const invalidSeats = seatNumbers.filter((seat) => !validSeats.has(seat));
      if (invalidSeats.length > 0) {
        throw new AppError(`Invalid seats: ${invalidSeats.join(', ')}`, 400);
      }

      await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${payload.showtimeId} FOR UPDATE`;

      const occupied = await tx.$queryRaw<{ seat_number: string }[]>`
        SELECT t."seat_number" AS seat_number
        FROM "tickets" t
        INNER JOIN "reservations" r ON r.id = t."reservation_id"
        WHERE r."showtime_id" = ${payload.showtimeId}
          AND r.status IN (${ReservationStatus.PENDING}::"ReservationStatus", ${ReservationStatus.PAID}::"ReservationStatus")
      `;

      const occupiedSet = new Set(occupied.map((seat) => seat.seat_number));
      const conflicts = seatNumbers.filter((seat) => occupiedSet.has(seat));

      if (conflicts.length > 0) {
        throw new AppError(`Seats already reserved: ${conflicts.join(', ')}`, 409);
      }

      if (seatNumbers.length > showtime.availableSeats) {
        throw new AppError('Not enough available seats remain for this showtime.', 409);
      }

      const reservation = await tx.reservation.create({
        data: {
          showtimeId: payload.showtimeId,
          userId: account.id,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const createdTickets = await Promise.all(
        seatNumbers.map(async (seatNumber) => {
          const qrCodeHash = createHash('sha256')
            .update(`${reservation.id}:${seatNumber}:${Date.now()}:${Math.random()}`)
            .digest('hex');

          return tx.ticket.create({
            data: {
              reservationId: reservation.id,
              seatNumber,
              qrCodeHash,
              status: TicketStatus.VALID,
            },
          });
        }),
      );

      await tx.showtime.update({
        where: { id: payload.showtimeId },
        data: {
          availableSeats: {
            decrement: seatNumbers.length,
          },
        },
      });

      return { reservation, createdTickets };
    });

    res.status(201).json({
      success: true,
      reservation: result.reservation,
      tickets: result.createdTickets,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservations/:reservationId/cancel', authMiddleware, async (req, res, next) => {
  try {
    const reservationId = req.params.reservationId;
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tickets: true, showtime: true },
    });

    if (!reservation || reservation.userId !== authenticatedUser.sub) {
      throw new AppError('Reservation not found.', 404);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      return res.json({
        success: true,
        cancelled: false,
        reservation,
        message: 'This reservation is no longer pending and cannot be cancelled.',
      });
    }

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CANCELLED },
        include: { tickets: true, showtime: true },
      });

      if (cancelled.tickets.length > 0) {
        await tx.showtime.update({
          where: { id: cancelled.showtimeId },
          data: {
            availableSeats: {
              increment: cancelled.tickets.length,
            },
          },
        });
      }

      await tx.ticket.updateMany({
        where: { reservationId: reservation.id },
        data: { status: TicketStatus.EXPIRED },
      });

      return cancelled;
    });

    return res.json({
      success: true,
      cancelled: true,
      reservation: updatedReservation,
      message: 'Reservation cancelled and seats released.',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/demo-confirm', authMiddleware, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Demo payments are disabled in production.', 403);
    }

    const payload = paymentConfirmationSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const reservation = await prisma.reservation.findUnique({
      where: { id: payload.reservationId },
      include: { tickets: true },
    });

    if (!reservation || reservation.userId !== authenticatedUser.sub) {
      throw new AppError('Reservation not found.', 404);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new AppError('This reservation is no longer payable.', 409);
    }

    if (reservation.expiresAt && reservation.expiresAt <= new Date()) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CANCELLED },
      });
      throw new AppError('The reservation has expired.', 409);
    }

    const paidReservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.PAID },
        include: {
          tickets: true,
          showtime: { include: { movie: true, room: true } },
        },
      });

      await tx.ticket.updateMany({
        where: { reservationId: reservation.id },
        data: { status: TicketStatus.VALID },
      });

      return updated;
    });

    return res.json({ success: true, reservation: paidReservation, mode: 'demo' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tickets', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const [tickets, stadiumTickets, parkingTickets, busTickets] = await Promise.all([
      prisma.ticket.findMany({
        where: { reservation: { userId: authenticatedUser.sub } },
        include: {
          reservation: {
            include: { showtime: { include: { movie: true, room: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stadiumTicket.findMany({
        where: { userId: authenticatedUser.sub },
        include: { match: { include: { stadium: true } }, sector: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parkingTicket.findMany({
        where: { userId: authenticatedUser.sub },
        include: { parking: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.busTicket.findMany({
        where: { userId: authenticatedUser.sub },
        include: { trip: { include: { route: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const cinemaTickets = tickets.map((ticket) => ({
      id: ticket.id,
      seatNumber: ticket.seatNumber,
      status: ticket.status,
      createdAt: ticket.createdAt,
      usedAt: ticket.usedAt,
      qrPayload: `ticketsafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
      reservationId: ticket.reservationId,
      reservationStatus: ticket.reservation.status,
      event: {
        title: ticket.reservation.showtime.movie.title,
        startTime: ticket.reservation.showtime.startTime,
        room: ticket.reservation.showtime.room.name,
      },
    }));

    const stadiumTicketDetails = stadiumTickets.map((ticket) => ({
      id: ticket.id,
      seatNumber: ticket.seatNumber,
      status: ticket.status,
      createdAt: ticket.createdAt,
      usedAt: ticket.usedAt,
      qrPayload: `stadiumsafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
      reservationId: `stadium:${ticket.id}`,
      reservationStatus: ReservationStatus.PAID,
      event: {
        title: `${ticket.match.homeTeam} vs ${ticket.match.awayTeam}`,
        startTime: ticket.match.startTime,
        room: `${ticket.match.stadium.name} · ${ticket.sector.name}`,
      },
    }));

    const parkingTicketDetails = parkingTickets.map((ticket) => ({
      id: ticket.id,
      seatNumber: String(ticket.spaceNumber),
      spaceNumber: ticket.spaceNumber,
      date: ticket.date,
      status: ticket.status,
      createdAt: ticket.createdAt,
      usedAt: ticket.usedAt,
      qrPayload: `parkingsafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
      reservationId: `parking:${ticket.id}`,
      reservationStatus: ReservationStatus.PAID,
      event: { title: ticket.parking.name, startTime: ticket.date, room: `${ticket.parking.city} · ${ticket.parking.address}` },
    }));

    const busTicketDetails = busTickets.map((ticket) => ({
      id: ticket.id,
      seatNumber: String(ticket.seatNumber),
      status: ticket.status,
      createdAt: ticket.createdAt,
      usedAt: ticket.usedAt,
      qrPayload: `bussafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
      reservationId: `bus:${ticket.id}`,
      reservationStatus: ReservationStatus.PAID,
      event: { title: `${ticket.trip.route.origin} → ${ticket.trip.route.destination}`, startTime: ticket.trip.departureTime, room: ticket.trip.route.operator },
    }));

    return res.json({
      tickets: [...cinemaTickets, ...stadiumTicketDetails, ...parkingTicketDetails, ...busTicketDetails].sort((first, second) =>
        second.createdAt.getTime() - first.createdAt.getTime(),
      ),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/tickets/validate', authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({ qrCode: z.string().min(1) });
    const payload = schema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string; role: UserRole } }).user;

    if (authenticatedUser.role !== UserRole.ADMIN && authenticatedUser.role !== UserRole.SCANNER) {
      throw new AppError('You do not have permission to validate tickets.', 403);
    }

    const qrCode = payload.qrCode.trim();
    const parkingMatches = qrCode.match(/^parkingsafe:v1:([^:]+):([^:]+)$/i);
    if (parkingMatches) {
      const parkingTicket = await prisma.parkingTicket.findUnique({ where: { id: parkingMatches[1] }, include: { parking: true } });
      if (!parkingTicket || parkingTicket.qrCodeHash !== parkingMatches[2]) return res.status(404).json({ valid: false, status: 'INVALID', message: 'Parking ticket not found or QR invalid.' });
      if (parkingTicket.status === ParkingTicketStatus.USED) return res.json({ valid: false, status: 'USED', message: 'This parking ticket has already been used.', ticket: { id: parkingTicket.id, spaceNumber: parkingTicket.spaceNumber, usedAt: parkingTicket.usedAt } });
      if (parkingTicket.status === ParkingTicketStatus.EXPIRED) return res.json({ valid: false, status: 'EXPIRED', message: 'This parking ticket has expired.', ticket: { id: parkingTicket.id, spaceNumber: parkingTicket.spaceNumber } });
      const updated = await prisma.parkingTicket.update({ where: { id: parkingTicket.id }, data: { status: ParkingTicketStatus.USED, usedAt: new Date() }, include: { parking: true } });
      return res.json({ valid: true, status: 'USED', message: 'Parking ticket validated successfully.', ticket: { id: updated.id, spaceNumber: updated.spaceNumber, status: updated.status, usedAt: updated.usedAt, event: { title: updated.parking.name, startTime: updated.date, room: `${updated.parking.city} · ${updated.parking.address}` } } });
    }

    const busMatches = qrCode.match(/^bussafe:v1:([^:]+):([^:]+)$/i);
    if (busMatches) {
      const busTicket = await prisma.busTicket.findUnique({ where: { id: busMatches[1] }, include: { trip: { include: { route: true } } } });
      if (!busTicket || busTicket.qrCodeHash !== busMatches[2]) return res.status(404).json({ valid: false, status: 'INVALID', message: 'Bus ticket not found or QR invalid.' });
      if (busTicket.status === BusTicketStatus.USED) return res.json({ valid: false, status: 'USED', message: 'This bus ticket has already been used.', ticket: { id: busTicket.id, seatNumber: busTicket.seatNumber, usedAt: busTicket.usedAt } });
      if (busTicket.status === BusTicketStatus.EXPIRED) return res.json({ valid: false, status: 'EXPIRED', message: 'This bus ticket has expired.', ticket: { id: busTicket.id, seatNumber: busTicket.seatNumber } });
      const updated = await prisma.busTicket.update({ where: { id: busTicket.id }, data: { status: BusTicketStatus.USED, usedAt: new Date() }, include: { trip: { include: { route: true } } } });
      return res.json({ valid: true, status: 'USED', message: 'Bus ticket validated successfully.', ticket: { id: updated.id, seatNumber: updated.seatNumber, status: updated.status, usedAt: updated.usedAt, event: { title: `${updated.trip.route.origin} → ${updated.trip.route.destination}`, startTime: updated.trip.departureTime, room: updated.trip.route.operator } } });
    }

    const stadiumMatches = qrCode.match(/^stadiumsafe:v1:([^:]+):([^:]+)$/i);
    if (stadiumMatches) {
      const stadiumTicket = await prisma.stadiumTicket.findUnique({
        where: { id: stadiumMatches[1] },
        include: { match: { include: { stadium: true } }, sector: true },
      });

      if (!stadiumTicket || stadiumTicket.qrCodeHash !== stadiumMatches[2]) {
        return res.status(404).json({
          valid: false,
          status: 'INVALID',
          message: 'Stadium ticket not found or QR invalid.',
        });
      }

      if (stadiumTicket.status === StadiumTicketStatus.USED) {
        return res.json({
          valid: false,
          status: 'USED',
          message: 'This stadium ticket has already been used.',
          ticket: {
            id: stadiumTicket.id,
            seatNumber: stadiumTicket.seatNumber,
            usedAt: stadiumTicket.usedAt,
            matchId: stadiumTicket.matchId,
            sector: stadiumTicket.sector.name,
          },
        });
      }

      if (stadiumTicket.status === StadiumTicketStatus.EXPIRED) {
        return res.json({
          valid: false,
          status: 'EXPIRED',
          message: 'This stadium ticket has expired.',
          ticket: {
            id: stadiumTicket.id,
            seatNumber: stadiumTicket.seatNumber,
            matchId: stadiumTicket.matchId,
            sector: stadiumTicket.sector.name,
          },
        });
      }

      const updatedStadiumTicket = await prisma.stadiumTicket.update({
        where: { id: stadiumTicket.id },
        data: { status: StadiumTicketStatus.USED, usedAt: new Date() },
        include: { match: { include: { stadium: true } }, sector: true },
      });

      return res.json({
        valid: true,
        status: 'USED',
        message: 'Stadium ticket validated successfully.',
        ticket: {
          id: updatedStadiumTicket.id,
          seatNumber: updatedStadiumTicket.seatNumber,
          status: updatedStadiumTicket.status,
          usedAt: updatedStadiumTicket.usedAt,
          matchId: updatedStadiumTicket.matchId,
          sector: updatedStadiumTicket.sector.name,
          stadium: updatedStadiumTicket.match.stadium.name,
        },
      });
    }

    const matches = qrCode.match(/^ticketsafe:v1:([^:]+):([^:]+)$/i);
    const ticketId = matches ? matches[1] : qrCode;
    const expectedHash = matches ? matches[2] : null;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        reservation: {
          include: {
            showtime: { include: { movie: true, room: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        status: 'INVALID',
        message: 'Ticket not found or QR invalid.',
      });
    }

    if (expectedHash && ticket.qrCodeHash !== expectedHash) {
      return res.status(409).json({
        valid: false,
        status: 'INVALID',
        message: 'This QR code does not correspond to the ticket.',
      });
    }

    if (ticket.reservation.status !== ReservationStatus.PAID) {
      return res.status(409).json({
        valid: false,
        status: 'INVALID',
        message: 'This ticket is not paid or is no longer valid.',
      });
    }

    if (ticket.status === TicketStatus.USED) {
      return res.json({
        valid: false,
        status: 'USED',
        message: 'This ticket has already been used.',
        ticket: {
          id: ticket.id,
          seatNumber: ticket.seatNumber,
          usedAt: ticket.usedAt,
          reservationId: ticket.reservationId,
        },
      });
    }

    if (ticket.status === TicketStatus.EXPIRED) {
      return res.json({
        valid: false,
        status: 'EXPIRED',
        message: 'This ticket has expired.',
        ticket: {
          id: ticket.id,
          seatNumber: ticket.seatNumber,
          reservationId: ticket.reservationId,
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.USED,
        usedAt: new Date(),
      },
      include: {
        reservation: {
          include: {
            showtime: { include: { movie: true, room: true } },
          },
        },
      },
    });

    return res.json({
      valid: true,
      status: 'USED',
      message: 'Ticket validated successfully.',
      ticket: {
        id: updated.id,
        seatNumber: updated.seatNumber,
        status: updated.status,
        usedAt: updated.usedAt,
        reservationId: updated.reservationId,
        event: {
          title: updated.reservation.showtime.movie.title,
          startTime: updated.reservation.showtime.startTime,
          room: updated.reservation.showtime.room.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/webhook', async (req, res, next) => {
  try {
    const payload = webhookSchema.parse(req.body);

    if (payload.event === 'payment.success') {
      await prisma.reservation.update({
        where: { id: payload.reservationId },
        data: { status: ReservationStatus.PAID },
      });

      await prisma.ticket.updateMany({
        where: { reservationId: payload.reservationId },
        data: { status: TicketStatus.VALID },
      });

      return res.json({ success: true, message: 'Payment confirmed and tickets released.' });
    }

    await prisma.reservation.update({
      where: { id: payload.reservationId },
      data: { status: ReservationStatus.CANCELLED },
    });

    return res.status(400).json({
      success: false,
      message: 'Payment failed; reservation has been cancelled.',
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  writeLog('ERROR', `${req.method} ${req.originalUrl}`, error);

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed.',
      details: error.issues,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'The requested record already exists.' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'The requested record was not found.' });
    }

    if (error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'The reservation changed while processing. Please choose the seats again.' });
    }
  }

  const err = error as Error & { statusCode?: number };
  console.error('Unhandled API error:', error);
  return res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message ?? 'Internal server error.',
  });
});

export { app, prisma };

if (require.main === module) {
  app.listen(port, () => {
    const message = `TiKetSafe API running at http://localhost:${port}`;
    console.log(message);
    writeLog('INFO', message);
    prisma.$connect()
      .then(() => writeLog('INFO', 'Database connection established'))
      .catch((error) => writeLog('ERROR', 'Database connection failed', error));
  }).on('error', (error) => writeLog('ERROR', 'Backend listener failed', error));

  const shutdown = async (signal: string) => {
    writeLog('INFO', `Shutdown requested: ${signal}`);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}
