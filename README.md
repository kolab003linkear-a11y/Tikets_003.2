# TiKetSafe

Aplicación para descubrir eventos, consultar estadios, reservar entradas y validar tickets digitales con QR. El proyecto combina una API Express + Prisma con una app Expo para web y móvil.

## Funcionalidades

- Registro e inicio de sesión con JWT.
- Catálogo de cine, teatro y conciertos.
- Consulta de partidos, estadios, sectores y disponibilidad.
- Selección y reserva de localidades.
- Emisión de tickets digitales con QR.
- Validación de tickets de cine y estadio.
- Paneles administrativos para eventos, salas, estadios y partidos.
- Módulos demo de parqueaderos y buses con disponibilidad calculada.
- Seed reproducible con datos de demostración para desarrollo.

## Estructura del repositorio

```text
.
├── backend/                  API Express + Prisma + PostgreSQL
│   ├── prisma/               esquema, migraciones y seed
│   ├── src/server.ts         servidor principal
│   ├── test/                 pruebas de integración
│   └── .env.example          variables de entorno del backend
├── frontend/                 app Expo para móvil y web
│   └── src/                  pantallas, contexto, tema y cliente API
├── scripts/                  comprobación operativa local
├── README.md                 documentación principal
├── MANUAL_STARTUP.md         guía de arranque en Windows
├── SETUP_AND_DEPLOYS.md      guía de instalación y despliegue
├── PROMPTS_AND_SOLUTIONS.md  historial de prompts y soluciones
├── STADIUMS_ROADMAP.md       estado del módulo de estadios
├── TASKS_ROADMAP.md          roadmap general del proyecto
├── TOOLS_AND_STRUCTURE.md    estructura y herramientas
├── VISUAL_IDENTITY_TICKETSAFE.md
└── package.json              scripts del monorepo
```

## Requisitos

- Node.js 20 LTS o superior
- npm 10 o superior
- Docker Desktop para PostgreSQL local
- Expo / React Native para ejecutar la app móvil o web
- Android Studio o un dispositivo móvil para pruebas nativas

## Arranque rápido

Desde la raíz del proyecto:

```bash
npm install
```

Crea el archivo de entorno del backend a partir del ejemplo:

```bash
cp backend/.env.example backend/.env
```

En Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

El archivo debe incluir valores como:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:55432/tiKets?schema=public"
PORT=4001
NODE_ENV="development"
JWT_SECRET="tiKets-dev-secret"
CORS_ORIGINS="http://localhost:8082,http://127.0.0.1:8082"
STRIPE_SECRET_KEY=""
PAYPHONE_API_KEY=""
PAYPHONE_WEBHOOK_SECRET=""
PAYMENT_WEBHOOK_SECRET="change-me-for-local-dev"
```

## Base de datos

```bash
npm --workspace backend run db:up
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed
```

El seed crea usuarios de prueba y datos demo para eventos, salas, estadios, parqueaderos y buses. Los nombres de terminales, horarios, andenes y operadores son datos de ejemplo para desarrollo.

Credenciales de administrador local:

```text
Correo: admin@tikets.com
Contraseña: demo1234
```

## Ejecución local

Abre dos terminales adicionales desde la raíz:

```bash
npm run dev:backend
npm run dev:frontend
```

La API queda en `http://localhost:4001` y la app web Expo en `http://localhost:8082`.

Para compilar el frontend directamente:

```bash
npm --workspace frontend run web
npm --workspace frontend run android
npm --workspace frontend run ios
```

## API principal

Los endpoints del backend se sirven bajo `/api`.

| Método | Endpoint | Acceso |
| --- | --- | --- |
| GET | `/health` | Público |
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| GET | `/catalog` | Público |
| GET | `/matches` | Público |
| POST | `/matches/:matchId/tickets` | Usuario autenticado |
| POST | `/reservations/create` | Usuario autenticado |
| POST | `/reservations/:id/cancel` | Propietario de la reserva |
| POST | `/payments/demo-confirm` | Usuario autenticado |
| POST | `/payments/webhook` | Proveedor de pagos |
| GET | `/tickets` | Usuario autenticado |
| POST | `/admin/tickets/validate` | Admin o scanner |
| GET | `/parking?date=AAAA-MM-DD` | Público |
| POST | `/parking/:parkingId/tickets` | Usuario autenticado |
| GET | `/buses?terminal=QUITUMBE&destination=...&operator=...` | Público |
| POST | `/bus-trips/:tripId/tickets` | Usuario autenticado |
| GET/POST | `/admin/stadiums` | Admin |
| GET/POST | `/admin/matches` | Admin |

Las operaciones administrativas requieren token JWT:

```http
Authorization: Bearer <token>
```

El sistema de pagos actual es de demostración. Stripe y PayPhone quedan preparados para integrarse mediante variables de entorno, pero la implementación real requiere configuración y validación en producción.

El webhook de pagos usa la cabecera `x-payment-signature` con un HMAC-SHA256 sobre `{event}:{reservationId}` usando `PAYMENT_WEBHOOK_SECRET`.

## Documentación adicional

- [Inicio manual de contenedores y servidores](MANUAL_STARTUP.md)
- [Guía de setup y despliegue](SETUP_AND_DEPLOYS.md)
- [Prompts y soluciones aplicadas](PROMPTS_AND_SOLUTIONS.md)
- [Roadmap del módulo de estadios](STADIUMS_ROADMAP.md)
- [Roadmap general de tareas](TASKS_ROADMAP.md)
- [Herramientas y estructura](TOOLS_AND_STRUCTURE.md)
- [Identidad visual](VISUAL_IDENTITY_TICKETSAFE.md)

## Verificación y build

```bash
npm --workspace backend test
npm run build:backend
npm run ops:check
```

## Estado del proyecto

La base de consulta, reserva, emisión y validación QR está implementada. Antes de pasar a producción deben completarse la integración real de pagos, la configuración de PostgreSQL y la validación final del despliegue de Android y web.
