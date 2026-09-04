import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, PrismaClient, ReservationStatus, StadiumTicketStatus, TicketStatus, UserRole, ParkingTicketStatus, BusTicketStatus, ParkingAccessMode, ParkingTicketMode, ParkingSpaceStatus, BusOriginTerminal } from '@prisma/client';
import { z } from 'zod';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
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

const adminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30).optional(),
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
  paymentMethod: z.enum(['CARD', 'DEUNA', 'GOOGLE_PAY', 'APPLE_PAY', 'PAYPAL', 'CASH']).optional(),
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
  ageRating: z.enum(['TODO_PUBLICO', '+7', '+12', '+15', '+18']).nullable().optional(),
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

const teamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  city: z.string().trim().max(80).nullable().optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
});

const favoriteTeamSchema = z.object({
  teamId: z.string().min(1),
});

// price === null significa "quitar el precio personalizado de este sector
// para este partido" (vuelve a usar StadiumSector.price por defecto).
const matchSectorPriceSchema = z.object({
  sectorId: z.string().min(1),
  price: z.coerce.number().positive().max(10000).nullable(),
});

const matchSchema = z.object({
  stadiumId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  startTime: z.coerce.date(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED']).optional(),
  // Precios por sector definidos en el momento de crear/editar el partido
  // (opcional: si se omite, todos los sectores venden al precio base).
  sectorPrices: z.array(matchSectorPriceSchema).max(100).optional(),
});

const matchPricesUpdateSchema = z.object({
  prices: z.array(matchSectorPriceSchema).min(1).max(100),
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
  operator: z.string().trim().min(1).max(120).default('Operador TiKetSafe'),
  openingHours: z.string().trim().min(1).max(120).default('Horario por confirmar'),
  terminalName: z.string().trim().max(120).nullable().optional(),
  accessMode: z.enum(['QR', 'TARJETA', 'TICKET']).default('QR'),
  vehicleTypes: z.array(z.string().trim().min(1).max(40)).min(1).max(20).default(['AUTO']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const parkingSpaceSchema = z.object({
  spaceNumber: z.coerce.number().int().min(1),
  floor: z.coerce.number().int().min(1).max(100).optional(),
  code: z.string().trim().min(1).max(20).optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'CLOSED']).optional(),
});

const parkingSpaceStatusSchema = z.object({ status: z.enum(['AVAILABLE', 'MAINTENANCE', 'CLOSED']) });

const parkingSpaceCode = (spaceNumber: number) => {
  const index = spaceNumber - 1;
  return `${String.fromCharCode(65 + Math.floor(index / 4) % 3)}${(index % 4) + 1}`;
};

async function ensureParkingSpaces(parkingId: string, totalSpaces: number) {
  const baseSize = Math.floor(totalSpaces / 3);
  const remainder = totalSpaces % 3;
  const floorSizes = [baseSize + (remainder > 0 ? 1 : 0), baseSize + (remainder > 1 ? 1 : 0), baseSize];
  const spaces = Array.from({ length: totalSpaces }, (_, index) => {
    const spaceNumber = index + 1;
    const floor = index < floorSizes[0] ? 1 : index < floorSizes[0] + floorSizes[1] ? 2 : 3;
    const letter = String.fromCharCode(64 + floor);
    const position = floor === 1 ? index + 1 : floor === 2 ? index - floorSizes[0] + 1 : index - floorSizes[0] - floorSizes[1] + 1;
    return { parkingId, spaceNumber, floor, code: `${letter}${position}-${floor}` };
  });
  const existing = await prisma.parkingSpace.findMany({ where: { parkingId }, select: { id: true, spaceNumber: true } });
  await prisma.$transaction([
    ...existing.map((space) => prisma.parkingSpace.update({ where: { id: space.id }, data: { code: `__sync_${parkingId}_${space.spaceNumber}` } })),
    ...spaces.map((space) => prisma.parkingSpace.upsert({
      where: { parkingId_spaceNumber: { parkingId, spaceNumber: space.spaceNumber } },
      create: space,
      update: { floor: space.floor, code: space.code },
    })),
  ]);
  return prisma.parkingSpace.findMany({ where: { parkingId, spaceNumber: { lte: totalSpaces } }, orderBy: { spaceNumber: 'asc' } });
}

const parkingTicketSchema = z.object({
  spaceNumber: z.coerce.number().int().min(1),
  date: z.coerce.date(),
  entryTime: z.coerce.date().nullable().optional(),
});

const parkingPaymentSchema = z.object({
  paymentMethod: z.enum(['CARD', 'DEUNA', 'GOOGLE_PAY', 'APPLE_PAY', 'PAYPAL', 'CASH']),
});

const busRouteSchema = z.object({
  origin: z.string().trim().min(1).max(100),
  originCity: z.string().trim().min(1).max(100).optional(),
  destination: z.string().trim().min(1).max(100),
  operator: z.string().trim().min(1).max(120),
  originTerminal: z.enum(['QUITUMBE', 'CARCELEN', 'CALDERON', 'GYE', 'ABA', 'MTA']).default('QUITUMBE'),
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

const moduleKeys = ['catalog', 'events', 'stadiums', 'parking', 'buses', 'assistant'] as const;
const moduleSchema = z.object({ enabled: z.boolean() });

async function getModuleSettings() {
  const settings = await prisma.moduleSetting.findMany({ where: { key: { in: [...moduleKeys] } } });
  return Object.fromEntries(moduleKeys.map((key) => [key, settings.find((setting) => setting.key === key)?.enabled ?? true]));
}

async function isModuleEnabled(key: (typeof moduleKeys)[number]) {
  return (await prisma.moduleSetting.findUnique({ where: { key }, select: { enabled: true } }))?.enabled ?? true;
}

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

async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Credential missing.', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  let decoded: { sub: string };
  try {
    decoded = jwt.verify(token, jwtSecret) as { sub: string };
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, email: true, role: true } });
    if (!user) return next(new AppError('Invalid or expired token.', 401));
    (req as Request & { user?: { sub: string; email: string; role: UserRole } }).user = { sub: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
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

app.get('/api/modules', async (_req, res, next) => {
  try {
    return res.json({ modules: await getModuleSettings() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/modules', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage modules.', 403);
    return res.json({ modules: await getModuleSettings() });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/modules/:moduleKey', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage modules.', 403);
    if (!moduleKeys.includes(req.params.moduleKey as (typeof moduleKeys)[number])) throw new AppError('Unknown module.', 404);
    const payload = moduleSchema.parse(req.body);
    await prisma.moduleSetting.upsert({ where: { key: req.params.moduleKey }, update: payload, create: { key: req.params.moduleKey, ...payload } });
    return res.json({ modules: await getModuleSettings() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/users', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can create administrators.', 403);

    const payload = adminUserSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: payload.fullName.trim(),
        phone: payload.phone?.trim() || null,
        role: UserRole.ADMIN,
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
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
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      throw new AppError('This email already has an account. Please sign in with your password.', 409);
    }
    const user = await prisma.user.create({
      data: {
        email,
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        passwordHash: await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12),
        role: UserRole.CLIENT,
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
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

app.get('/api/teams', async (_req, res, next) => {
  try {
    const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
    return res.json({ teams });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/teams', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage teams.', 403);
    const payload = teamSchema.parse(req.body);
    const team = await prisma.team.create({
      data: { name: payload.name, city: payload.city ?? null, logoUrl: payload.logoUrl ?? null },
    });
    return res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/teams/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage teams.', 403);
    const payload = teamSchema.parse(req.body);
    const team = await prisma.team.update({
      where: { id: req.params.teamId },
      data: { name: payload.name, city: payload.city ?? null, logoUrl: payload.logoUrl ?? null },
    });
    return res.json({ team });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/teams/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage teams.', 403);
    await prisma.team.delete({ where: { id: req.params.teamId } });
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me/favorite-teams', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const favorites = await prisma.userFavoriteTeam.findMany({
      where: { userId: authenticatedUser.sub },
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ teams: favorites.map((favorite) => favorite.team) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/me/favorite-teams', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const payload = favoriteTeamSchema.parse(req.body);

    const team = await prisma.team.findUnique({ where: { id: payload.teamId }, select: { id: true } });
    if (!team) throw new AppError('Team not found.', 404);

    await prisma.userFavoriteTeam.upsert({
      where: { userId_teamId: { userId: authenticatedUser.sub, teamId: payload.teamId } },
      update: {},
      create: { userId: authenticatedUser.sub, teamId: payload.teamId },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/me/favorite-teams/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    await prisma.userFavoriteTeam.delete({
      where: { userId_teamId: { userId: authenticatedUser.sub, teamId: req.params.teamId } },
    });
    return res.json({ success: true });
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

app.get('/api/admin/food', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;

    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage food products.', 403);
    }

    const products = await prisma.foodProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ products });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/food', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;

    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage food products.', 403);
    }

    const product = await prisma.foodProduct.create({
      data: {
        name: req.body.name,
        description: req.body.description ?? null,
        imageUrl: req.body.imageUrl ?? null,
        price: Number(req.body.price),
        category: req.body.category,
        active: req.body.active ?? true,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/food/:productId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;

    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage food products.', 403);
    }

    const product = await prisma.foodProduct.update({
      where: { id: req.params.productId },
      data: {
        name: req.body.name,
        description: req.body.description ?? null,
        imageUrl: req.body.imageUrl ?? null,
        price: Number(req.body.price),
        category: req.body.category,
        active: req.body.active ?? true,
      },
    });

    return res.json({ product });
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
    const { movieId, ...restPayload } = payload;
    const showtime = await prisma.showtime.create({
  data: { ...restPayload, movieId, availableSeats },
  include: {
    movie: { select: { id: true, title: true } },
    room: { select: { id: true, name: true, capacity: true } },
  },
});
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
    const { movieId, ...restPayload } = payload;
    const showtime = await prisma.showtime.update({
      where: { id: req.params.showtimeId },
      data: { ...restPayload, movieId, availableSeats },
      include: { movie: { select: { id: true, title: true } }, room: { select: { id: true, name: true, capacity: true } } },
    });
    return res.json({ showtime });
  } catch (error) {
    next(error);
  }
});

app.get('/api/stadiums', async (_req, res, next) => {
  try {
    if (!(await isModuleEnabled('stadiums'))) return res.json({ stadiums: [] });
    const stadiums = await prisma.stadium.findMany({ include: { sectors: true }, orderBy: { name: 'asc' } });
    return res.json({ stadiums });
  } catch (error) {
    next(error);
  }
});

app.get('/api/matches', async (_req, res, next) => {
  try {
    if (!(await isModuleEnabled('stadiums'))) return res.json({ matches: [] });
    const matches = await prisma.match.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] } },
      include: {
        stadium: { include: { sectors: true } },
        homeTeam: true,
        awayTeam: true,
        tickets: { where: { status: { in: [StadiumTicketStatus.VALID, StadiumTicketStatus.USED] } }, select: { sectorId: true, seatNumber: true } },
        sectorPrices: true,
        _count: { select: { tickets: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    // El precio que ve el cliente es el de MatchSectorPrice para ESTE partido
    // si el admin lo definió; si no, se usa el precio base de StadiumSector.
    return res.json({ matches: matches.map(({ tickets, sectorPrices, ...match }) => ({
      ...match,
      stadium: {
        ...match.stadium,
        sectors: match.stadium.sectors.map((sector) => {
          const override = sectorPrices.find((entry) => entry.sectorId === sector.id);
          return {
            ...sector,
            price: override ? override.price : sector.price,
            occupiedSeats: tickets.filter((ticket) => ticket.sectorId === sector.id).map((ticket) => ticket.seatNumber),
          };
        }),
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
    const matches = await prisma.match.findMany({ include: { stadium: true, homeTeam: true, awayTeam: true, _count: { select: { tickets: true, sectorPrices: true } } }, orderBy: { startTime: 'asc' } });
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
    if (payload.homeTeamId === payload.awayTeamId) throw new AppError('Home and away teams must be different.', 400);
    const stadium = await prisma.stadium.findUnique({ where: { id: payload.stadiumId }, select: { id: true } });
    if (!stadium) throw new AppError('Stadium not found.', 404);
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: payload.homeTeamId }, select: { id: true } }),
      prisma.team.findUnique({ where: { id: payload.awayTeamId }, select: { id: true } }),
    ]);
    if (!homeTeam || !awayTeam) throw new AppError('Home or away team not found.', 404);

    const { sectorPrices, ...matchData } = payload;
    if (sectorPrices?.length) await assertSectorsBelongToStadium(payload.stadiumId, sectorPrices);

    const match = await prisma.match.create({ data: { ...matchData, status: matchData.status ?? 'SCHEDULED' }, include: { stadium: true, homeTeam: true, awayTeam: true } });
    if (sectorPrices?.length) await applySectorPrices(match.id, sectorPrices);

    const { prices } = await buildMatchSectorPrices(match.id);
    return res.status(201).json({ match, prices });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/matches/:matchId', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage matches.', 403);
    const payload = matchSchema.parse(req.body);
    if (payload.homeTeamId === payload.awayTeamId) throw new AppError('Home and away teams must be different.', 400);

    const { sectorPrices, ...matchData } = payload;
    if (sectorPrices?.length) await assertSectorsBelongToStadium(payload.stadiumId, sectorPrices);

    const match = await prisma.match.update({ where: { id: req.params.matchId }, data: { ...matchData, status: matchData.status ?? 'SCHEDULED' }, include: { stadium: true, homeTeam: true, awayTeam: true } });
    if (sectorPrices?.length) await applySectorPrices(match.id, sectorPrices);

    const { prices } = await buildMatchSectorPrices(match.id);
    return res.json({ match, prices });
  } catch (error) {
    next(error);
  }
});

type SectorPriceEntryInput = { sectorId: string; price: number | null };

// Verifica que cada sectorId de la lista pertenezca al estadio del partido
// (evita asignarle precio a un sector de otro estadio).
async function assertSectorsBelongToStadium(stadiumId: string, prices: SectorPriceEntryInput[]) {
  if (prices.length === 0) return;
  const sectors = await prisma.stadiumSector.findMany({ where: { stadiumId }, select: { id: true } });
  const validSectorIds = new Set(sectors.map((sector) => sector.id));
  for (const entry of prices) {
    if (!validSectorIds.has(entry.sectorId)) throw new AppError('Sector does not belong to this match\'s stadium.', 400);
  }
}

// Aplica una lista de precios por sector a un partido: price number = crea o
// actualiza el precio personalizado; price null = lo quita (vuelve al precio
// base del sector). La usan la creación/edición de partidos y el endpoint
// dedicado de precios por partido.
async function applySectorPrices(matchId: string, prices: SectorPriceEntryInput[]) {
  if (prices.length === 0) return;
  await prisma.$transaction(
    prices.map((entry) =>
      entry.price === null
        ? prisma.matchSectorPrice.deleteMany({ where: { matchId, sectorId: entry.sectorId } })
        : prisma.matchSectorPrice.upsert({
            where: { matchId_sectorId: { matchId, sectorId: entry.sectorId } },
            create: { matchId, sectorId: entry.sectorId, price: entry.price },
            update: { price: entry.price },
          }),
    ),
  );
}

// Arma, para un partido, la lista de sectores de su estadio con su precio
// base, el precio personalizado (si existe) y el precio efectivo que verá
// el cliente. La usan tanto el GET como el PUT de precios por partido.
async function buildMatchSectorPrices(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { stadium: { include: { sectors: true } }, sectorPrices: true },
  });
  if (!match) throw new AppError('Match not found.', 404);

  const overrideBySector = new Map(match.sectorPrices.map((entry) => [entry.sectorId, entry]));
  const prices = match.stadium.sectors.map((sector) => {
    const override = overrideBySector.get(sector.id);
    return {
      sectorId: sector.id,
      sectorName: sector.name,
      sectorCode: sector.code,
      basePrice: sector.price,
      matchPrice: override ? override.price : null,
      effectivePrice: override ? override.price : sector.price,
    };
  });
  return { matchId: match.id, stadiumId: match.stadiumId, prices };
}

app.get('/api/admin/matches/:matchId/prices', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage match prices.', 403);
    const result = await buildMatchSectorPrices(req.params.matchId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/matches/:matchId/prices', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { role: UserRole } }).user;
    if (authenticatedUser.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage match prices.', 403);
    const payload = matchPricesUpdateSchema.parse(req.body);

    const match = await prisma.match.findUnique({ where: { id: req.params.matchId }, select: { id: true, stadiumId: true } });
    if (!match) throw new AppError('Match not found.', 404);

    await assertSectorsBelongToStadium(match.stadiumId, payload.prices);
    await applySectorPrices(match.id, payload.prices);

    const result = await buildMatchSectorPrices(match.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/matches/:matchId/tickets', authMiddleware, async (req, res, next) => {
  try {
    if (!(await isModuleEnabled('stadiums'))) throw new AppError('The stadiums module is disabled.', 409);
    const payload = stadiumTicketSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const account = await prisma.user.findUnique({ where: { id: authenticatedUser.sub }, select: { id: true, fullName: true, phone: true } });
    if (!account) throw new AppError('Your session is no longer valid. Please sign in again.', 401);
    const match = await prisma.match.findUnique({ where: { id: req.params.matchId }, include: { stadium: true, homeTeam: true, awayTeam: true } });
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
    const ticket = await prisma.stadiumTicket.create({ data: { matchId: req.params.matchId, sectorId: payload.sectorId, userId: account.id, seatNumber: normalizedSeat, qrCodeHash }, include: { match: { include: { stadium: true, homeTeam: true, awayTeam: true } }, sector: true } });
    return res.status(201).json({ ticket: { id: ticket.id, qrPayload: `stadiumsafe:v1:${ticket.id}:${ticket.qrCodeHash}`, status: ticket.status, seatNumber: ticket.seatNumber, sector: ticket.sector.name, match: ticket.match } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/parking', async (_req, res, next) => {
  try {
    if (!(await isModuleEnabled('parking'))) return res.json({ parking: [] });
    const requestedDate = _req.query.date ? new Date(String(_req.query.date)) : new Date();
    requestedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(requestedDate); nextDate.setDate(nextDate.getDate() + 1);
    const parking = await prisma.parkingLot.findMany({ where: { status: 'ACTIVE' }, include: { tickets: { where: { date: { gte: requestedDate, lt: nextDate }, status: ParkingTicketStatus.VALID }, select: { spaceNumber: true } } }, orderBy: { name: 'asc' } });
    return res.json({ parking: await Promise.all(parking.map(async ({ tickets, ...item }) => {
      const spaces = await ensureParkingSpaces(item.id, item.totalSpaces);
      const reserved = new Set(tickets.map((ticket) => ticket.spaceNumber));
      return { ...item, spaces: spaces.map((space) => ({ ...space, occupied: reserved.has(space.spaceNumber) })), reservedSpaces: tickets.length, availableSpaces: Math.max(item.totalSpaces - tickets.length, 0), reservedSpaceNumbers: tickets.map((ticket) => ticket.spaceNumber), availabilityDate: requestedDate.toISOString() };
    })) });
  } catch (error) { next(error); }
});

app.get('/api/buses', async (_req, res, next) => {
  try {
    if (!(await isModuleEnabled('buses'))) return res.json({ routes: [] });
    const terminal = _req.query.terminal ? String(_req.query.terminal) : undefined;
    const destination = _req.query.destination ? String(_req.query.destination) : undefined;
    const operator = _req.query.operator ? String(_req.query.operator) : undefined;
    const originCity = _req.query.originCity ? String(_req.query.originCity) : undefined;
    const routes = await prisma.busRoute.findMany({ where: { status: 'ACTIVE', originTerminal: terminal as BusOriginTerminal | undefined, originCity, destination: destination ? { contains: destination, mode: 'insensitive' } : undefined, operator: operator ? { contains: operator, mode: 'insensitive' } : undefined }, include: { trips: { where: { status: { not: 'CANCELLED' } }, include: { tickets: { where: { status: { in: ['VALID', 'USED'] } }, select: { seatNumber: true } } }, orderBy: { departureTime: 'asc' } } }, orderBy: { origin: 'asc' } });
    return res.json({ routes: routes.map(({ trips, ...route }) => ({ ...route, trips: trips.map(({ tickets, ...trip }) => ({ ...trip, occupiedSeats: tickets.map((ticket) => ticket.seatNumber), availableSeats: Math.max(trip.totalSeats - tickets.length, 0) })) })) });
  } catch (error) { next(error); }
});

app.get('/api/admin/parking', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking lots.', 403);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const parking = await prisma.parkingLot.findMany({
      include: {
        _count: { select: { tickets: true } },
        tickets: {
          where: { date: { gte: today, lt: tomorrow }, status: ParkingTicketStatus.VALID },
          select: { spaceNumber: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const dailyTickets = await prisma.parkingTicket.findMany({ where: { date: { gte: today, lt: tomorrow }, status: { in: [ParkingTicketStatus.VALID, ParkingTicketStatus.USED] } }, select: { parkingId: true, status: true, entryTime: true, exitTime: true, usedAt: true, createdAt: true, parking: { select: { price: true } } } });
    const now = Date.now();
    const revenue = dailyTickets.reduce((total, ticket) => {
      const startedAt = Math.max((ticket.entryTime ?? ticket.createdAt).getTime(), today.getTime());
      const finishedAt = ticket.status === ParkingTicketStatus.USED ? (ticket.exitTime ?? ticket.usedAt ?? ticket.createdAt).getTime() : now;
      return total + Math.max((finishedAt - startedAt) / 3600000, 0) * Number(ticket.parking.price);
    }, 0);
    const demandByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: dailyTickets.filter((ticket) => (ticket.entryTime ?? ticket.createdAt).getHours() === hour).length }));
    return res.json({ parking: await Promise.all(parking.map(async ({ tickets, ...item }) => {
      const spaces = await ensureParkingSpaces(item.id, item.totalSpaces);
      const occupied = new Set(tickets.map((ticket) => ticket.spaceNumber));
      return { ...item, spaces: spaces.map((space) => ({ ...space, occupied: occupied.has(space.spaceNumber) })) };
    })), projectedRevenue: revenue, finalizedRevenue: dailyTickets.filter((ticket) => ticket.status === ParkingTicketStatus.USED).reduce((total, ticket) => total + Math.max(((ticket.exitTime ?? ticket.usedAt ?? ticket.createdAt).getTime() - Math.max((ticket.entryTime ?? ticket.createdAt).getTime(), today.getTime())) / 3600000, 0) * Number(ticket.parking.price), 0), demandByHour, revenueDate: today.toISOString().slice(0, 10), updatedAt: new Date().toISOString() });
  } catch (error) { next(error); }
});

app.post('/api/admin/parking/:parkingId/spaces', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking spaces.', 403);
    const payload = parkingSpaceSchema.parse(req.body);
    const parking = await prisma.parkingLot.findUnique({ where: { id: req.params.parkingId } });
    if (!parking) throw new AppError('Parking lot not found.', 404);
    if (payload.spaceNumber > parking.totalSpaces) await prisma.parkingLot.update({ where: { id: parking.id }, data: { totalSpaces: payload.spaceNumber } });
    const nextTotal = Math.max(parking.totalSpaces, payload.spaceNumber);
    const baseSize = Math.floor(nextTotal / 3);
    const remainder = nextTotal % 3;
    const floorSizes = [baseSize + (remainder > 0 ? 1 : 0), baseSize + (remainder > 1 ? 1 : 0), baseSize];
    const floor = payload.floor ?? (payload.spaceNumber <= floorSizes[0] ? 1 : payload.spaceNumber <= floorSizes[0] + floorSizes[1] ? 2 : 3);
    const position = floor === 1 ? payload.spaceNumber : floor === 2 ? payload.spaceNumber - floorSizes[0] : payload.spaceNumber - floorSizes[0] - floorSizes[1];
    const code = payload.code ?? `${String.fromCharCode(64 + floor)}${position}-${floor}`;
    const space = await prisma.parkingSpace.create({ data: { parkingId: parking.id, spaceNumber: payload.spaceNumber, floor, code, status: payload.status ? ParkingSpaceStatus[payload.status] : ParkingSpaceStatus.AVAILABLE } });
    if (nextTotal !== parking.totalSpaces) await ensureParkingSpaces(parking.id, nextTotal);
    return res.status(201).json({ space });
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('La plaza ya existe en este parqueadero.', 409)); next(error); }
});

app.delete('/api/admin/parking/:parkingId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can delete parking lots.', 403);
    await prisma.parkingLot.delete({ where: { id: req.params.parkingId } });
    return res.json({ success: true });
  } catch (error) { next(error); }
});

app.patch('/api/admin/parking/:parkingId/spaces/:spaceId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking spaces.', 403);
    const payload = parkingSpaceStatusSchema.parse(req.body);
    const space = await prisma.parkingSpace.findFirst({ where: { id: req.params.spaceId, parkingId: req.params.parkingId } });
    if (!space) throw new AppError('Parking space not found.', 404);
    if (payload.status !== 'AVAILABLE') {
      const activeTicket = await prisma.parkingTicket.findFirst({ where: { parkingId: space.parkingId, spaceNumber: space.spaceNumber, status: ParkingTicketStatus.VALID, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(24, 0, 0, 0)) } } });
      if (activeTicket) throw new AppError('No puedes cerrar una plaza con una reserva activa.', 409);
    }
    return res.json({ space: await prisma.parkingSpace.update({ where: { id: space.id }, data: { status: ParkingSpaceStatus[payload.status] } }) });
  } catch (error) { next(error); }
});

app.post('/api/admin/parking', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage parking lots.', 403);
    const payload = parkingSchema.parse(req.body);
    const parking = await prisma.parkingLot.create({ data: { ...payload, status: payload.status ?? 'ACTIVE' } });
    const spaces = await ensureParkingSpaces(parking.id, parking.totalSpaces);
    return res.status(201).json({ parking: { ...parking, spaces } });
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
    if (!(await isModuleEnabled('parking'))) throw new AppError('The parking module is disabled.', 409);
    const payload = parkingTicketSchema.parse(req.body);
    const user = (req as Request & { user: { sub: string } }).user;
    const parking = await prisma.parkingLot.findUnique({ where: { id: req.params.parkingId } });
    if (!parking || parking.status !== 'ACTIVE') throw new AppError('Parking lot is not available.', 409);
    if (payload.spaceNumber > parking.totalSpaces) throw new AppError('Space is outside this parking lot.', 400);
    const space = await prisma.parkingSpace.findUnique({ where: { parkingId_spaceNumber: { parkingId: parking.id, spaceNumber: payload.spaceNumber } } });
    if (space && space.status !== ParkingSpaceStatus.AVAILABLE) throw new AppError('This parking space is not available.', 409);
    const date = new Date(payload.date); date.setHours(0, 0, 0, 0);
    const activeReservation = await prisma.parkingTicket.findFirst({ where: { parkingId: parking.id, spaceNumber: payload.spaceNumber, date, status: ParkingTicketStatus.VALID }, select: { id: true } });
    if (activeReservation) throw new AppError('Ese espacio ya está reservado para la fecha seleccionada.', 409);
    const qrCodeHash = createHash('sha256').update(`${parking.id}:${payload.spaceNumber}:${date.toISOString()}:${Date.now()}:${Math.random()}`).digest('hex');
    const ticket = await prisma.parkingTicket.create({ data: { parkingId: parking.id, userId: user.sub, spaceNumber: payload.spaceNumber, date, entryTime: payload.entryTime ?? null, ticketMode: parking.accessMode as ParkingTicketMode, entryMetadata: { demo: true, accessMode: parking.accessMode, operator: parking.operator, terminalName: parking.terminalName, date: date.toISOString() }, qrCodeHash }, include: { parking: true } });
    return res.status(201).json({ ticket: { id: ticket.id, spaceNumber: ticket.spaceNumber, date: ticket.date, createdAt: ticket.createdAt, status: ticket.status, qrPayload: `parkingsafe:v1:${ticket.id}:${ticket.qrCodeHash}`, parking: ticket.parking } });
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('Ese espacio ya está reservado para la fecha seleccionada.', 409)); next(error); }
});

app.post('/api/parking/tickets/:ticketId/pay', authMiddleware, async (req, res, next) => {
  try {
    const payload = parkingPaymentSchema.parse(req.body);
    const user = (req as Request & { user: { sub: string } }).user;
    const ticket = await prisma.parkingTicket.findUnique({ where: { id: req.params.ticketId }, include: { parking: true } });
    if (!ticket || ticket.userId !== user.sub) throw new AppError('Parking ticket not found.', 404);
    if (ticket.status !== ParkingTicketStatus.VALID) throw new AppError('This parking ticket is no longer payable.', 409);

    const paidTicket = await prisma.parkingTicket.update({
      where: { id: ticket.id },
      data: { status: ParkingTicketStatus.USED, usedAt: new Date(), exitTime: new Date(), entryMetadata: { ...(ticket.entryMetadata as object), paymentMethod: payload.paymentMethod } },
      include: { parking: true },
    });
    return res.json({ success: true, paymentMethod: payload.paymentMethod, ticket: { id: paidTicket.id, spaceNumber: paidTicket.spaceNumber, date: paidTicket.date, createdAt: paidTicket.createdAt, status: paidTicket.status, qrPayload: `parkingsafe:v1:${paidTicket.id}:${paidTicket.qrCodeHash}`, parking: paidTicket.parking } });
  } catch (error) {
    next(error);
  }
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
    return res.status(201).json({ route: await prisma.busRoute.create({ data: { ...payload, originCity: payload.originCity ?? payload.origin, status: payload.status ?? 'ACTIVE' } }) });
  } catch (error) { next(error); }
});

app.patch('/api/admin/bus-routes/:routeId', authMiddleware, async (req, res, next) => {
  try {
    const user = (req as Request & { user: { role: UserRole } }).user;
    if (user.role !== UserRole.ADMIN) throw new AppError('Only administrators can manage bus routes.', 403);
    const payload = busRouteSchema.parse(req.body);
    return res.json({ route: await prisma.busRoute.update({ where: { id: req.params.routeId }, data: { ...payload, originCity: payload.originCity ?? payload.origin, status: payload.status ?? 'ACTIVE' } }) });
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
    if (!(await isModuleEnabled('buses'))) throw new AppError('The buses module is disabled.', 409);
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
    if (!(await isModuleEnabled('catalog'))) return res.json({ movies: [] });
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
                OR: [
                  { status: ReservationStatus.PAID },
                  { status: ReservationStatus.PENDING, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
                ],
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
          availableSeats: Math.max(showtime.room.capacity - showtime.reservations.flatMap((reservation) => reservation.tickets).length, 0),
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

      const expiredReservations = await tx.reservation.findMany({
        where: { showtimeId: payload.showtimeId, status: ReservationStatus.PENDING, expiresAt: { lte: new Date() } },
        select: { id: true, tickets: { select: { id: true } } },
      });
      const expiredTicketCount = expiredReservations.reduce((count, reservation) => count + reservation.tickets.length, 0);
      if (expiredReservations.length > 0) {
        await tx.reservation.updateMany({ where: { id: { in: expiredReservations.map((reservation) => reservation.id) } }, data: { status: ReservationStatus.CANCELLED } });
        await tx.ticket.updateMany({ where: { reservationId: { in: expiredReservations.map((reservation) => reservation.id) } }, data: { status: TicketStatus.EXPIRED } });
        if (expiredTicketCount > 0) {
          await tx.showtime.update({ where: { id: payload.showtimeId }, data: { availableSeats: { increment: expiredTicketCount } } });
        }
      }

      const currentShowtime = await tx.showtime.findUnique({ where: { id: payload.showtimeId }, include: { room: true } });
      if (!currentShowtime) throw new AppError('Selected showtime was not found.', 404);

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

      const availableSeatCount = Math.max(currentShowtime.room.capacity - occupiedSet.size, 0);
      if (seatNumbers.length > availableSeatCount) {
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
          availableSeats: availableSeatCount - seatNumbers.length,
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
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: reservation.id }, data: { status: ReservationStatus.CANCELLED } });
        await tx.ticket.updateMany({ where: { reservationId: reservation.id }, data: { status: TicketStatus.EXPIRED } });
        if (reservation.tickets.length > 0) {
          await tx.showtime.update({ where: { id: reservation.showtimeId }, data: { availableSeats: { increment: reservation.tickets.length } } });
        }
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
        include: { match: { include: { stadium: true, homeTeam: true, awayTeam: true } }, sector: true },
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
        title: `${ticket.match.homeTeam.name} vs ${ticket.match.awayTeam.name}`,
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
      const claimed = await prisma.parkingTicket.updateMany({ where: { id: parkingTicket.id, status: ParkingTicketStatus.VALID }, data: { status: ParkingTicketStatus.USED, usedAt: new Date() } });
      if (claimed.count === 0) return res.json({ valid: false, status: 'USED', message: 'This parking ticket has already been used.' });
      const updated = await prisma.parkingTicket.findUniqueOrThrow({ where: { id: parkingTicket.id }, include: { parking: true } });
      return res.json({ valid: true, status: 'USED', message: 'Parking ticket validated successfully.', ticket: { id: updated.id, spaceNumber: updated.spaceNumber, status: updated.status, usedAt: updated.usedAt, event: { title: updated.parking.name, startTime: updated.date, room: `${updated.parking.city} · ${updated.parking.address}` } } });
    }

    const busMatches = qrCode.match(/^bussafe:v1:([^:]+):([^:]+)$/i);
    if (busMatches) {
      const busTicket = await prisma.busTicket.findUnique({ where: { id: busMatches[1] }, include: { trip: { include: { route: true } } } });
      if (!busTicket || busTicket.qrCodeHash !== busMatches[2]) return res.status(404).json({ valid: false, status: 'INVALID', message: 'Bus ticket not found or QR invalid.' });
      if (busTicket.status === BusTicketStatus.USED) return res.json({ valid: false, status: 'USED', message: 'This bus ticket has already been used.', ticket: { id: busTicket.id, seatNumber: busTicket.seatNumber, usedAt: busTicket.usedAt } });
      if (busTicket.status === BusTicketStatus.EXPIRED) return res.json({ valid: false, status: 'EXPIRED', message: 'This bus ticket has expired.', ticket: { id: busTicket.id, seatNumber: busTicket.seatNumber } });
      const claimed = await prisma.busTicket.updateMany({ where: { id: busTicket.id, status: BusTicketStatus.VALID }, data: { status: BusTicketStatus.USED, usedAt: new Date() } });
      if (claimed.count === 0) return res.json({ valid: false, status: 'USED', message: 'This bus ticket has already been used.' });
      const updated = await prisma.busTicket.findUniqueOrThrow({ where: { id: busTicket.id }, include: { trip: { include: { route: true } } } });
      return res.json({ valid: true, status: 'USED', message: 'Bus ticket validated successfully.', ticket: { id: updated.id, seatNumber: updated.seatNumber, status: updated.status, usedAt: updated.usedAt, event: { title: `${updated.trip.route.origin} → ${updated.trip.route.destination}`, startTime: updated.trip.departureTime, room: updated.trip.route.operator } } });
    }

    const stadiumMatches = qrCode.match(/^stadiumsafe:v1:([^:]+):([^:]+)$/i);
    if (stadiumMatches) {
      const stadiumTicket = await prisma.stadiumTicket.findUnique({
        where: { id: stadiumMatches[1] },
        include: { match: { include: { stadium: true, homeTeam: true, awayTeam: true } }, sector: true },
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

      const claimed = await prisma.stadiumTicket.updateMany({ where: { id: stadiumTicket.id, status: StadiumTicketStatus.VALID }, data: { status: StadiumTicketStatus.USED, usedAt: new Date() } });
      if (claimed.count === 0) return res.json({ valid: false, status: 'USED', message: 'This stadium ticket has already been used.' });
  const updatedStadiumTicket = await prisma.stadiumTicket.findUniqueOrThrow({ where: { id: stadiumTicket.id }, include: { match: { include: { stadium: true, homeTeam: true, awayTeam: true } }, sector: true } });

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

    const claimed = await prisma.ticket.updateMany({ where: { id: ticket.id, status: TicketStatus.VALID }, data: { status: TicketStatus.USED, usedAt: new Date() } });
    if (claimed.count === 0) return res.json({ valid: false, status: 'USED', message: 'This ticket has already been used.' });
    const updated = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id }, include: { reservation: { include: { showtime: { include: { movie: true, room: true } } } } } });

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
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const signature = req.header('x-payment-signature');
    if (!webhookSecret || !signature) throw new AppError('Payment webhook is not configured.', 503);
    const expectedSignature = createHmac('sha256', webhookSecret).update(`${payload.event}:${payload.reservationId}`).digest('hex');
    if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new AppError('Invalid payment webhook signature.', 401);
    }

    if (payload.event === 'payment.success') {
      await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({ where: { id: payload.reservationId }, include: { tickets: true } });
        if (!reservation) throw new AppError('Reservation not found.', 404);
        if (reservation.status === ReservationStatus.PAID) return;
        if (reservation.status !== ReservationStatus.PENDING) throw new AppError('Reservation is no longer payable.', 409);
        if (reservation.expiresAt && reservation.expiresAt <= new Date()) {
          await tx.reservation.update({ where: { id: reservation.id }, data: { status: ReservationStatus.CANCELLED } });
          await tx.ticket.updateMany({ where: { reservationId: reservation.id }, data: { status: TicketStatus.EXPIRED } });
          if (reservation.tickets.length > 0) await tx.showtime.update({ where: { id: reservation.showtimeId }, data: { availableSeats: { increment: reservation.tickets.length } } });
          throw new AppError('The reservation has expired.', 409);
        }
        await tx.reservation.update({ where: { id: reservation.id }, data: { status: ReservationStatus.PAID } });
        await tx.ticket.updateMany({ where: { reservationId: reservation.id }, data: { status: TicketStatus.VALID } });
      });

      return res.json({ success: true, message: 'Payment confirmed and tickets released.' });
    }

    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id: payload.reservationId }, include: { tickets: true } });
      if (!reservation) throw new AppError('Reservation not found.', 404);
      if (reservation.status === ReservationStatus.CANCELLED) return;
      if (reservation.status !== ReservationStatus.PENDING) throw new AppError('Reservation is no longer pending.', 409);
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: ReservationStatus.CANCELLED } });
      await tx.ticket.updateMany({ where: { reservationId: reservation.id }, data: { status: TicketStatus.EXPIRED } });
      if (reservation.tickets.length > 0) await tx.showtime.update({ where: { id: reservation.showtimeId }, data: { availableSeats: { increment: reservation.tickets.length } } });
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