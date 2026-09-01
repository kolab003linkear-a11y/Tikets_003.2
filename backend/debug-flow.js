const { app, prisma } = require('./dist/server.js');
(async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const email = `debug-${Date.now()}@example.com`;
  const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  const register = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'demo1234', role: 'CLIENT' }),
  });
  console.log('REGISTER', register.status);
  console.log(await register.text());

  const catalog = await request('/api/catalog');
  console.log('CATALOG', catalog.status);
  const catalogJson = await catalog.json();
  console.log('MOVIES', catalogJson.movies.length);
  console.log('SHOWTIMES', catalogJson.movies.flatMap((movie) => movie.showtimes).length);
  const showtime = catalogJson.movies.flatMap((movie) => movie.showtimes).find((item) => item.availableSeats > 0);
  console.log('SHOWTIME_FOUND', !!showtime, showtime && showtime.id, showtime && showtime.availableSeats);
  if (showtime) {
    const seatLayout = showtime.room.seatLayout;
    const occupied = new Set(showtime.occupiedSeats || []);
    const seat = seatLayout.rows.flatMap((row) => Array.from({ length: seatLayout.columns }, (_, index) => `${row}${index + 1}`)).find((item) => !occupied.has(item));
    console.log('SEAT', seat);
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'demo1234' }),
    });
    console.log('LOGIN', login.status);
    const loginJson = await login.json();
    console.log('TOKEN_OK', !!loginJson.token);
    const headers = { Authorization: `Bearer ${loginJson.token}` };
    const reservation = await request('/api/reservations/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: loginJson.user.id, showtimeId: showtime.id, seatNumbers: [seat] }),
    });
    console.log('RESERVATION', reservation.status);
    console.log(await reservation.text());
  }

  await prisma.user.deleteMany({ where: { email } });
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
