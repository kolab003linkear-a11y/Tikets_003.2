import { PrismaClient, UserRole, MovieCategory, EventStatus, MatchStatus, ParkingLotStatus, BusRouteStatus, BusTripStatus, ParkingAccessMode, BusOriginTerminal } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@tikets.com';
  const adminPassword = 'demo1234';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  });

  const adminPasswordValid = await bcrypt.compare(adminPassword, admin.passwordHash);
  if (!adminPasswordValid) {
    throw new Error(`Admin seed verification failed for ${admin.email}.`);
  }

  const clientEmail = 'cliente@tikets.com';
  const clientPassword = 'demo1234';
  const clientPasswordHash = await bcrypt.hash(clientPassword, 12);

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { passwordHash: clientPasswordHash, role: UserRole.CLIENT, fullName: 'Juan Pérez (Cliente demo)' },
    create: {
      email: clientEmail,
      passwordHash: clientPasswordHash,
      role: UserRole.CLIENT,
      fullName: 'Juan Pérez (Cliente demo)',
    },
    select: { id: true, email: true },
  });

  const movie1 = await prisma.movieEvent.upsert({
    where: { id: 'movie-1' },
    update: {
      title: 'The Odyssey en 35mm',
      synopsis: 'Después de la Guerra de Troya, Odiseo enfrenta un peligroso viaje de regreso a Ítaca, encontrándose con Polifemo, las Sirenas y Calipso.',
      duration: 172,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2026/07/Chang_Odyssey_CT-K020-18.webp',
      trailerUrl: 'https://www.youtube.com/watch?v=f_bKjZeJBBI',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
    create: {
      id: 'movie-1',
      title: 'The Odyssey en 35mm',
      synopsis: 'Después de la Guerra de Troya, Odiseo enfrenta un peligroso viaje de regreso a Ítaca, encontrándose con Polifemo, las Sirenas y Calipso.',
      duration: 172,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2026/07/Chang_Odyssey_CT-K020-18.webp',
      trailerUrl: 'https://www.youtube.com/watch?v=f_bKjZeJBBI',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
  });

  const movie2 = await prisma.movieEvent.upsert({
    where: { id: 'movie-2' },
    update: {
      title: 'El niño probeta',
      synopsis: 'Susana y Miguel adquieren un tratamiento para elegir las características de su futuro hijo, pero el nacimiento de Francisco despierta dudas en su familia.',
      duration: 81,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2026/07/FIC26_NinoProbeta-1024x576-1.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=kfo0tnvwoh4',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
    create: {
      id: 'movie-2',
      title: 'El niño probeta',
      synopsis: 'Susana y Miguel adquieren un tratamiento para elegir las características de su futuro hijo, pero el nacimiento de Francisco despierta dudas en su familia.',
      duration: 81,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2026/07/FIC26_NinoProbeta-1024x576-1.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=kfo0tnvwoh4',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
  });

  const movie3 = await prisma.movieEvent.upsert({
    where: { id: 'movie-3' },
    update: {
      title: 'Coyote vs Acme',
      synopsis: 'Una historia ambientada en el almacén de ACME, el fabricante de todo lo que utilizan los personajes de los Looney Tunes.',
      duration: 101,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2025/01/Coyote_vs_Acme_Poster_Oficial.webp',
      trailerUrl: 'https://www.youtube.com/watch?v=DIqJb0LwSho',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
    create: {
      id: 'movie-3',
      title: 'Coyote vs Acme',
      synopsis: 'Una historia ambientada en el almacén de ACME, el fabricante de todo lo que utilizan los personajes de los Looney Tunes.',
      duration: 101,
      category: MovieCategory.CINE,
      posterUrl: 'https://www.ochoymedio.net/wp-content/uploads/2025/01/Coyote_vs_Acme_Poster_Oficial.webp',
      trailerUrl: 'https://www.youtube.com/watch?v=DIqJb0LwSho',
      rating: null,
      status: EventStatus.NOW_SHOWING,
    },
  });

  const room = await prisma.room.upsert({
    where: { id: 'room-1' },
    update: {},
    create: {
      id: 'room-1',
      name: 'Sala 1',
      capacity: 64,
      seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 8 },
    },
  });

  const stadiumQuito = await prisma.stadium.upsert({
    where: { id: 'stadium-quito-001' },
    update: { name: 'Estadio Banco Guayaquil', city: 'Quito', imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bede9f55?auto=format&fit=crop&w=1200&q=80' },
    create: {
      id: 'stadium-quito-001',
      name: 'Estadio Banco Guayaquil',
      city: 'Quito',
      capacity: 8000,
      imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bede9f55?auto=format&fit=crop&w=1200&q=80',
      seatLayout: { rows: Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i)), columns: 40 },
      sectors: {
        create: [
          { name: 'Occidental', code: 'OCC', capacity: 2000, price: 25, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E'], columns: 40 } },
          { name: 'Oriental', code: 'ORI', capacity: 2000, price: 25, seatLayout: { rows: ['F', 'G', 'H', 'I', 'J'], columns: 40 } },
          { name: 'Norte', code: 'NOR', capacity: 2000, price: 15, seatLayout: { rows: ['K', 'L', 'M', 'N', 'O'], columns: 40 } },
          { name: 'Sur', code: 'SUR', capacity: 2000, price: 15, seatLayout: { rows: ['P', 'Q', 'R', 'S', 'T'], columns: 40 } },
        ],
      },
    },
    include: { sectors: true },
  });

  const stadiumGuayaquil = await prisma.stadium.upsert({
    where: { id: 'stadium-guayaquil-001' },
    update: { name: 'Estadio Jocay', city: 'Manta', imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80' },
    create: {
      id: 'stadium-guayaquil-001',
      name: 'Estadio Jocay',
      city: 'Guayaquil',
      capacity: 8500,
      imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
      seatLayout: { rows: Array.from({ length: 22 }, (_, i) => String.fromCharCode(65 + i)), columns: 38 },
      sectors: {
        create: [
          { name: 'VIP Sur', code: 'VIP_S', capacity: 2500, price: 45, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F'], columns: 40 } },
          { name: 'Preferencial Norte', code: 'PREF_N', capacity: 2000, price: 30, seatLayout: { rows: ['G', 'H', 'I', 'J', 'K'], columns: 40 } },
          { name: 'General Este', code: 'GEN_E', capacity: 2000, price: 18, seatLayout: { rows: ['L', 'M', 'N', 'O', 'P'], columns: 40 } },
          { name: 'General Oeste', code: 'GEN_O', capacity: 2000, price: 18, seatLayout: { rows: ['Q', 'R', 'S', 'T', 'U'], columns: 40 } },
        ],
      },
    },
    include: { sectors: true },
  });

  const stadiumCapwell = await prisma.stadium.upsert({
    where: { id: 'stadium-capwell-001' },
    update: { name: 'Estadio Bellavista', city: 'Ambato', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80' },
    create: {
      id: 'stadium-capwell-001',
      name: 'Estadio Bellavista',
      city: 'Guayaquil',
      capacity: 7500,
      imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      seatLayout: { rows: Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i)), columns: 37 },
      sectors: {
        create: [
          { name: 'Tribuna Local', code: 'TRIB_L', capacity: 2000, price: 28, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E'], columns: 40 } },
          { name: 'Tribuna Visitante', code: 'TRIB_V', capacity: 1500, price: 28, seatLayout: { rows: ['F', 'G', 'H', 'I'], columns: 37 } },
          { name: 'Preferencial', code: 'PREF', capacity: 2000, price: 22, seatLayout: { rows: ['J', 'K', 'L', 'M', 'N'], columns: 40 } },
          { name: 'General', code: 'GEN', capacity: 2000, price: 12, seatLayout: { rows: ['O', 'P', 'Q', 'R', 'S'], columns: 40 } },
        ],
      },
    },
    include: { sectors: true },
  });

  const stadiumAmbato = await prisma.stadium.upsert({
    where: { id: 'stadium-ambato-001' },
    update: { name: 'Estadio COAC Mushuc Runa', city: 'Ambato', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80' },
    create: {
      id: 'stadium-ambato-001',
      name: 'Estadio COAC Mushuc Runa',
      city: 'Ambato',
      capacity: 6000,
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      seatLayout: { rows: Array.from({ length: 15 }, (_, i) => String.fromCharCode(65 + i)), columns: 40 },
      sectors: {
        create: [
          { name: 'Preferencial', code: 'PREF', capacity: 2000, price: 20, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E'], columns: 40 } },
          { name: 'General Norte', code: 'GEN_N', capacity: 2000, price: 10, seatLayout: { rows: ['F', 'G', 'H', 'I', 'J'], columns: 40 } },
          { name: 'General Sur', code: 'GEN_S', capacity: 2000, price: 10, seatLayout: { rows: ['K', 'L', 'M', 'N', 'O'], columns: 40 } },
        ],
      },
    },
    include: { sectors: true },
  });

  const teamDefs = [
    { id: 'team-independiente-del-valle', name: 'Independiente del Valle', city: 'Sangolquí' },
    { id: 'team-universidad-catolica', name: 'Universidad Católica', city: 'Quito' },
    { id: 'team-delfin', name: 'Delfín', city: 'Manta' },
    { id: 'team-tecnico-universitario', name: 'Técnico Universitario', city: 'Ambato' },
    { id: 'team-liga-de-quito', name: 'Liga de Quito', city: 'Quito' },
    { id: 'team-mushuc-runa', name: 'Mushuc Runa', city: 'Ambato' },
    { id: 'team-macara', name: 'Macará', city: 'Ambato' },
    { id: 'team-manta-fc', name: 'Manta F.C.', city: 'Manta' },
    { id: 'team-deportivo-cuenca', name: 'Deportivo Cuenca', city: 'Cuenca' },
    { id: 'team-guayaquil-city', name: 'Guayaquil City', city: 'Guayaquil' },
    { id: 'team-barcelona-sc', name: 'Barcelona SC', city: 'Guayaquil' },
    { id: 'team-aucas', name: 'Aucas', city: 'Quito' },
    { id: 'team-leones-del-norte', name: 'Leones del Norte', city: 'Ibarra' },
    { id: 'team-orense', name: 'Orense', city: 'Machala' },
    { id: 'team-libertad-fc', name: 'Libertad FC', city: 'Loja' },
    { id: 'team-emelec', name: 'Emelec', city: 'Guayaquil' },
  ];

  const teamsById = new Map();
  for (const t of teamDefs) {
    const createdTeam = await prisma.team.upsert({
      where: { id: t.id },
      update: { name: t.name, city: t.city },
      create: { id: t.id, name: t.name, city: t.city },
      select: { id: true, name: true },
    });
    teamsById.set(t.id, createdTeam);
  }

  const team = (id: string) => teamsById.get(id).id;

  const nextWeekShowtimes = [
    { id: 'show-next-001', movieEventId: movie1.id, startTime: '2026-09-01T18:00:00-05:00' },
    { id: 'show-next-002', movieEventId: movie2.id, startTime: '2026-09-02T19:00:00-05:00' },
    { id: 'show-next-003', movieEventId: movie3.id, startTime: '2026-09-03T16:30:00-05:00' },
    { id: 'show-next-004', movieEventId: movie1.id, startTime: '2026-09-04T20:00:00-05:00' },
    { id: 'show-next-005', movieEventId: movie2.id, startTime: '2026-09-05T18:00:00-05:00' },
    { id: 'show-next-006', movieEventId: movie3.id, startTime: '2026-09-06T16:00:00-05:00' },
  ];

  await prisma.showtime.upsert({
    where: { id: 'show-001' },
    update: { movieEventId: movie1.id, roomId: room.id, startTime: new Date('2026-08-29T20:00:00-05:00'), price: 7, availableSeats: 64 },
    create: { id: 'show-001', movieEventId: movie1.id, roomId: room.id, startTime: new Date('2026-08-29T20:00:00-05:00'), price: 7, availableSeats: 64 },
  });

  for (const showtime of nextWeekShowtimes) {
    await prisma.showtime.upsert({
      where: { id: showtime.id },
      update: { movieEventId: showtime.movieEventId, roomId: room.id, startTime: new Date(showtime.startTime), price: 7, availableSeats: room.capacity },
      create: { id: showtime.id, movieEventId: showtime.movieEventId, roomId: room.id, startTime: new Date(showtime.startTime), price: 7, availableSeats: room.capacity },
    });
  }

  const upcomingMovies = [
    { id: 'movie-4', title: 'Moscas', synopsis: 'Una mujer solitaria ve cómo sus hábitos cambian cuando una presencia inesperada altera su vida cotidiana.', posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-5', title: 'La Invitación', synopsis: 'Una invitación inesperada abre la puerta a una historia de tensión, secretos y decisiones difíciles.', posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-6', title: 'La Piel Pulpo', synopsis: 'Una mirada al crecimiento, la familia y los vínculos que se transforman con el paso del tiempo.', posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-7', title: 'Franz', synopsis: 'Retrato del emblemático escritor checo Franz Kafka, construido como un mosaico sobre su vida y obra.', posterUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-8', title: 'Father mother sister brother', synopsis: 'Tres actos alrededor del reencuentro de los miembros de una familia.', posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-9', title: 'Viejos malditos', synopsis: 'Tras la muerte de su esposa, Elías encuentra una nueva razón para vivir en una visita inesperada.', posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-10', title: 'Hiedra', synopsis: 'Una mujer marcada por un suceso observa a un grupo de adolescentes que conviven en un orfanato.', posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-11', title: 'A tus espaldas', synopsis: 'Un empleado de banco busca esconder sus orígenes humildes por medio del dinero, poder y aceptación.', posterUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-12', title: 'Arquitectura y poder: ¿quién construye el mundo que habitamos?', synopsis: 'Un ciclo sobre ciudades, edificios, poder y las aspiraciones de una sociedad.', posterUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-13', title: 'Ángel', synopsis: 'Retrato de una persona trans afrodescendiente y exboxeador profesional de Ecuador.', posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-14', title: 'Malena', synopsis: 'Parte de Il Cinema Parla Italiano, un programa para acercarse al cine y al idioma italiano.', posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-15', title: 'Cabeza de Ratón', synopsis: 'Un publicista ambicioso descubre que pertenecer no siempre significa hacer lo correcto.', posterUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-16', title: 'CINE Y CROCHET', synopsis: 'Ciclo especial que incluye Monty Python: La vida de Brian, presentada en inglés con subtítulos en español.', posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
    { id: 'movie-17', title: 'Eurocine · Puerta abierta', synopsis: 'Franja permanente de cine europeo como antesala a la proxima edicion del festival Eurocine.', posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' },
  ];

  for (const movie of upcomingMovies) {
    await prisma.movieEvent.upsert({
      where: { id: movie.id },
      update: { title: movie.title, synopsis: movie.synopsis, duration: 100, category: MovieCategory.CINE, posterUrl: movie.posterUrl, trailerUrl: null, rating: null, status: EventStatus.COMING_SOON },
      create: { ...movie, duration: 100, category: MovieCategory.CINE, trailerUrl: null, rating: null, status: EventStatus.COMING_SOON },
    });
  }

  await prisma.showtime.upsert({
    where: { id: 'show-002' },
    update: { movieEventId: movie2.id, roomId: room.id, startTime: new Date('2026-08-29T18:00:00-05:00'), price: 7, availableSeats: 64 },
    create: { id: 'show-002', movieEventId: movie2.id, roomId: room.id, startTime: new Date('2026-08-29T18:00:00-05:00'), price: 7, availableSeats: 64 },
  });

  await prisma.showtime.upsert({
    where: { id: 'show-003' },
    update: { movieEventId: movie3.id, roomId: room.id, startTime: new Date('2026-08-29T16:00:00-05:00'), price: 7, availableSeats: 64 },
    create: { id: 'show-003', movieEventId: movie3.id, roomId: room.id, startTime: new Date('2026-08-29T16:00:00-05:00'), price: 7, availableSeats: 64 },
  });

  await prisma.match.upsert({
    where: { id: 'match-001' },
    update: { stadiumId: stadiumQuito.id, homeTeamId: team('team-independiente-del-valle'), awayTeamId: team('team-universidad-catolica'), startTime: new Date('2026-08-29T13:00:00-05:00'), status: MatchStatus.SCHEDULED },
    create: { id: 'match-001', stadiumId: stadiumQuito.id, homeTeamId: team('team-independiente-del-valle'), awayTeamId: team('team-universidad-catolica'), startTime: new Date('2026-08-29T13:00:00-05:00'), status: MatchStatus.SCHEDULED },
  });

  const nextWeekMatches = [
    { id: 'match-next-001', stadiumId: stadiumGuayaquil.id, homeTeamId: team('team-delfin'), awayTeamId: team('team-tecnico-universitario'), startTime: '2026-09-01T16:30:00-05:00' },
    { id: 'match-next-002', stadiumId: stadiumQuito.id, homeTeamId: team('team-liga-de-quito'), awayTeamId: team('team-mushuc-runa'), startTime: '2026-09-01T19:00:00-05:00' },
    { id: 'match-next-003', stadiumId: stadiumCapwell.id, homeTeamId: team('team-macara'), awayTeamId: team('team-manta-fc'), startTime: '2026-09-02T14:00:00-05:00' },
    { id: 'match-next-004', stadiumId: stadiumAmbato.id, homeTeamId: team('team-deportivo-cuenca'), awayTeamId: team('team-guayaquil-city'), startTime: '2026-09-02T16:30:00-05:00' },
    { id: 'match-next-005', stadiumId: stadiumGuayaquil.id, homeTeamId: team('team-barcelona-sc'), awayTeamId: team('team-independiente-del-valle'), startTime: '2026-09-02T19:00:00-05:00' },
    { id: 'match-next-006', stadiumId: stadiumQuito.id, homeTeamId: team('team-universidad-catolica'), awayTeamId: team('team-aucas'), startTime: '2026-09-03T14:00:00-05:00' },
    { id: 'match-next-007', stadiumId: stadiumAmbato.id, homeTeamId: team('team-leones-del-norte'), awayTeamId: team('team-orense'), startTime: '2026-09-03T16:30:00-05:00' },
    { id: 'match-next-008', stadiumId: stadiumCapwell.id, homeTeamId: team('team-libertad-fc'), awayTeamId: team('team-emelec'), startTime: '2026-09-03T19:00:00-05:00' },
  ];

  for (const match of nextWeekMatches) {
    const { id, stadiumId, homeTeamId, awayTeamId, startTime } = match;
    await prisma.match.upsert({
      where: { id },
      update: { stadiumId, homeTeamId, awayTeamId, startTime: new Date(startTime), status: MatchStatus.SCHEDULED },
      create: { id, stadiumId, homeTeamId, awayTeamId, startTime: new Date(startTime), status: MatchStatus.SCHEDULED },
    });
  }

  await prisma.match.upsert({
    where: { id: 'match-002' },
    update: { stadiumId: stadiumGuayaquil.id, homeTeamId: team('team-manta-fc'), awayTeamId: team('team-barcelona-sc'), startTime: new Date('2026-08-29T19:00:00-05:00'), status: MatchStatus.SCHEDULED },
    create: { id: 'match-002', stadiumId: stadiumGuayaquil.id, homeTeamId: team('team-manta-fc'), awayTeamId: team('team-barcelona-sc'), startTime: new Date('2026-08-29T19:00:00-05:00'), status: MatchStatus.SCHEDULED },
  });

  await prisma.match.upsert({
    where: { id: 'match-003' },
    update: { stadiumId: stadiumCapwell.id, homeTeamId: team('team-tecnico-universitario'), awayTeamId: team('team-deportivo-cuenca'), startTime: new Date('2026-08-28T19:00:00-05:00'), status: MatchStatus.SCHEDULED },
    create: { id: 'match-003', stadiumId: stadiumCapwell.id, homeTeamId: team('team-tecnico-universitario'), awayTeamId: team('team-deportivo-cuenca'), startTime: new Date('2026-08-28T19:00:00-05:00'), status: MatchStatus.SCHEDULED },
  });

  await prisma.match.upsert({
    where: { id: 'match-004' },
    update: { stadiumId: stadiumAmbato.id, homeTeamId: team('team-mushuc-runa'), awayTeamId: team('team-delfin'), startTime: new Date('2026-08-28T15:30:00-05:00'), status: MatchStatus.SCHEDULED },
    create: { id: 'match-004', stadiumId: stadiumAmbato.id, homeTeamId: team('team-mushuc-runa'), awayTeamId: team('team-delfin'), startTime: new Date('2026-08-28T15:30:00-05:00'), status: MatchStatus.SCHEDULED },
  });

  const favoriteTeamIds = ['team-barcelona-sc', 'team-liga-de-quito', 'team-independiente-del-valle'];
  for (const teamId of favoriteTeamIds) {
    await prisma.userFavoriteTeam.upsert({
      where: { userId_teamId: { userId: client.id, teamId } },
      update: {},
      create: { userId: client.id, teamId },
    });
  }

  const parkingLots = [
    { id: 'parking-quito-centro', name: 'Parking Centro Histórico (demo)', address: 'García Moreno y Chile', city: 'Quito', totalSpaces: 120, price: 2.5, operator: 'Operador demo TiKetSafe', openingHours: '06:00-22:00', terminalName: null, accessMode: ParkingAccessMode.QR, vehicleTypes: ['AUTO', 'MOTO'] },
    { id: 'parking-terminal', name: 'Parking Terminal (demo)', address: 'Av. Mariscal Sucre', city: 'Quito', totalSpaces: 80, price: 1.75, operator: 'Operador demo TiKetSafe', openingHours: '24/7 (demo)', terminalName: 'Quitumbe', accessMode: ParkingAccessMode.TARJETA, vehicleTypes: ['AUTO', 'MOTO', 'SUV'] },
  ];
  for (const parking of parkingLots) {
    await prisma.parkingLot.upsert({
      where: { id: parking.id },
      update: { ...parking, status: ParkingLotStatus.ACTIVE },
      create: { ...parking, status: ParkingLotStatus.ACTIVE },
    });
  }

  const busRoutes = [
    { id: 'route-quito-guayaquil', origin: 'Quito', destination: 'Guayaquil', operator: 'Operador demo Sierra Costa', originTerminal: BusOriginTerminal.QUITUMBE },
    { id: 'route-quito-cuenca', origin: 'Quito', destination: 'Cuenca', operator: 'Operador demo Andino', originTerminal: BusOriginTerminal.CARCELEN },
  ];
  for (const route of busRoutes) {
    await prisma.busRoute.upsert({ where: { id: route.id }, update: { ...route, status: BusRouteStatus.ACTIVE }, create: { ...route, status: BusRouteStatus.ACTIVE } });
  }

  const busTrips = [
    { id: 'trip-quito-guayaquil-001', routeId: 'route-quito-guayaquil', departureTime: '2026-09-01T07:00:00-05:00', arrivalTime: '2026-09-01T15:00:00-05:00', boardingPlatform: 'Andén demo 12', baggageInfo: '1 pieza incluida (demo)', price: 18, totalSeats: 40 },
    { id: 'trip-quito-guayaquil-002', routeId: 'route-quito-guayaquil', departureTime: '2026-09-01T21:00:00-05:00', arrivalTime: '2026-09-02T05:00:00-05:00', boardingPlatform: 'Andén demo 8', baggageInfo: 'Equipaje sujeto a validación del operador (demo)', price: 20, totalSeats: 40 },
    { id: 'trip-quito-cuenca-001', routeId: 'route-quito-cuenca', departureTime: '2026-09-02T08:30:00-05:00', arrivalTime: '2026-09-02T17:00:00-05:00', boardingPlatform: 'Andén demo 4', baggageInfo: '1 pieza incluida (demo)', price: 16, totalSeats: 36 },
  ];
  for (const trip of busTrips) {
    await prisma.busTrip.upsert({ where: { id: trip.id }, update: { ...trip, departureTime: new Date(trip.departureTime), arrivalTime: new Date(trip.arrivalTime), status: BusTripStatus.SCHEDULED }, create: { ...trip, departureTime: new Date(trip.departureTime), arrivalTime: new Date(trip.arrivalTime), status: BusTripStatus.SCHEDULED } });
  }

  console.log('Seed ok:', {
    admin: admin.email,
    client: client.email,
    movies: [movie1.title, movie2.title, movie3.title, ...upcomingMovies.map((movie) => movie.title)],
    stadiums: ['Banco Guayaquil', 'Jocay', 'Bellavista', 'COAC Mushuc Runa'],
    teams: teamDefs.length,
    matches: 12,
    favoriteTeams: favoriteTeamIds.length,
    parkingLots: parkingLots.length,
    busTrips: busTrips.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });