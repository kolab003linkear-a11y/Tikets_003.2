# TiKetSafe

Aplicacion movil para descubrir eventos, seleccionar localidades, reservar entradas y mostrar tickets digitales con codigo QR. Incluye un modulo de estadios para consultar partidos, sectores, localidades y validar el acceso desde perfiles administrativos.

## Funcionalidades

- Registro e inicio de sesion con JWT.
- Catalogo de peliculas, conciertos y teatro.
- Consulta de partidos, estadios, sectores y disponibilidad.
- Seleccion y reserva de localidades.
- Emision de tickets digitales con QR.
- Validacion de tickets de cine y estadio.
- Control de acceso para administradores y escaneres.
- Paneles administrativos para eventos, salas, estadios y partidos.
- Seed reproducible con datos de demostracion.
- Modulos demo de parqueaderos y buses con disponibilidad calculada, QR y conflictos controlados.

## Estructura

```text
.
+-- backend/                 API Express, Prisma y PostgreSQL
|   +-- prisma/              Esquema, migraciones y seed
|   +-- src/server.ts        API HTTP
|   +-- test/                Pruebas de integracion
+-- frontend/                Aplicacion Expo para movil y web
|   +-- src/                 Pantallas, autenticacion, API y tema visual
+-- scripts/                 Diagnosticos operativos
+-- SETUP_AND_DEPLOYS.md     Guia detallada de instalacion y despliegue
+-- MANUAL_STARTUP.md        Inicio manual de contenedores y servidores
+-- PROMPTS_AND_SOLUTIONS.md Registro de prompts y soluciones aplicadas
+-- STADIUMS_ROADMAP.md      Estado del modulo de estadios
+-- VISUAL_IDENTITY_TICKETSAFE.md
```

## Requisitos

- Node.js 20 LTS o superior.
- npm 10 o superior.
- Docker Desktop para PostgreSQL local.
- Expo CLI o ejecucion mediante `npx expo`.
- Android Studio para probar en Android o un dispositivo movil.

## Instalacion inicial

Desde la raiz del proyecto:

```bash
npm install
npm install --workspaces
```

Para una guia completa de inicio manual en Windows PowerShell, consulta [MANUAL_STARTUP.md](MANUAL_STARTUP.md).

Configura las variables del backend en `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:55432/tiKets?schema=public"
PORT=4001
NODE_ENV="development"
JWT_SECRET="cambia-esta-clave-por-una-segura"
CORS_ORIGINS="http://localhost:8082"
STRIPE_SECRET_KEY="sk_test_xxx"
PAYPHONE_API_KEY="your_payphone_key"
PAYPHONE_WEBHOOK_SECRET="your_webhook_secret"
PAYMENT_WEBHOOK_SECRET="your_payment_webhook_secret"
```

Para una configuracion inicial, puedes partir de `backend/.env.example`.

## Base de datos

Inicia PostgreSQL y prepara Prisma:

```bash
npm --workspace backend run db:up
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed
```

El seed crea un usuario administrador y datos de ejemplo para eventos, salas, estadios, parkings y buses. Los nombres de terminales Quitumbe/Carcelen, horarios, andenes, operadores y modalidades de acceso son datos demo editables, no una publicacion oficial.

Credenciales demo del administrador:

```text
Correo: admin@tikets.com
Contrasena: demo1234
```

No uses estas credenciales en produccion.

## Ejecucion

Inicia PostgreSQL, la API y Expo en terminales separadas:

```bash
npm --workspace backend run db:up
npm run dev:backend
npm run dev:frontend
```

La API queda disponible en `http://localhost:4001` y el cliente Expo web en `http://localhost:8082`.

Comandos del frontend:

```bash
npm --workspace frontend run web
npm --workspace frontend run android
npm --workspace frontend run ios
```

## API principal

Todos los endpoints se sirven bajo `/api`.

| Metodo | Endpoint | Acceso |
| --- | --- | --- |
| GET | `/health` | Publico |
| POST | `/auth/register` | Publico |
| POST | `/auth/login` | Publico |
| GET | `/catalog` | Publico |
| GET | `/matches` | Publico |
| POST | `/matches/:matchId/tickets` | Usuario autenticado |
| POST | `/reservations/create` | Usuario autenticado |
| POST | `/reservations/:id/cancel` | Propietario de la reserva |
| POST | `/payments/demo-confirm` | Usuario autenticado |
| POST | `/payments/webhook` | Proveedor de pagos con firma HMAC |
| GET | `/tickets` | Usuario autenticado |
| POST | `/admin/tickets/validate` | Admin o scanner |
| GET | `/parking?date=AAAA-MM-DD` | Publico, disponibilidad demo por fecha |
| POST | `/parking/:parkingId/tickets` | Usuario autenticado |
| GET | `/buses?terminal=QUITUMBE&destination=...&operator=...` | Publico, filtros y aforo demo |
| POST | `/bus-trips/:tripId/tickets` | Usuario autenticado |
| GET/POST | `/admin/stadiums` | Admin |
| GET/POST | `/admin/matches` | Admin |

Las mutaciones administrativas requieren un token JWT en la cabecera:

```http
Authorization: Bearer <token>
```

El pago implementado actualmente es de demostracion. La integracion con Stripe o PayPhone queda preparada mediante variables de entorno, pero requiere completar el proveedor real antes de produccion.

El webhook requiere `x-payment-signature`, calculada como HMAC-SHA256 con `PAYMENT_WEBHOOK_SECRET` sobre el texto `{event}:{reservationId}`.

## Datos demo e integracion real

Las referencias de producto consideradas son UrbaPark (red de estacionamientos, acceso sin ticket mediante tarjeta/QR y operacion extendida en algunos sitios) y EPMMOP (terminales Quitumbe y Carcelen, boleterias, andenes, encomiendas, comercio y control operativo). En esta aplicacion solo se modelan como contexto de diseno: no se afirma afiliacion, disponibilidad, horario ni operacion oficial.

La reserva de parking usa una unicidad logica por parqueadero, espacio y fecha, no sensores ni inventario conectado. Por eso la app la presenta como pase/reserva demo. Una integracion real debe conectar la disponibilidad del operador, validar horarios y modalidad de acceso, y reemplazar los datos seed por fuentes autorizadas.

## Pruebas y build

Ejecuta la suite de integracion del backend:

```bash
npm --workspace backend test
```

Compila la API:

```bash
npm run build:backend
```

El diagnostico operativo comprueba servicios, puertos, PostgreSQL, migraciones, API y dependencias:

```powershell
npm run ops:check
```

## Documentacion adicional

- [Inicio manual de contenedores y servidores](MANUAL_STARTUP.md)
- [Prompts y soluciones aplicadas](PROMPTS_AND_SOLUTIONS.md)
- [Guia de setup y despliegue](SETUP_AND_DEPLOYS.md)
- [Roadmap del modulo de estadios](STADIUMS_ROADMAP.md)
- [Roadmap general de tareas](TASKS_ROADMAP.md)
- [Herramientas y estructura](TOOLS_AND_STRUCTURE.md)
- [Identidad visual](VISUAL_IDENTITY_TICKETSAFE.md)

## Estado del proyecto

El flujo principal de consulta, reserva, emision y validacion QR esta implementado y cubierto por pruebas de backend. Antes de produccion aun deben completarse el proveedor de pago real, la configuracion de PostgreSQL de despliegue y los builds finales de Android y web.
