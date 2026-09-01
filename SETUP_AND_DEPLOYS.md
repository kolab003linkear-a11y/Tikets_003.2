# TiKetSafe: configuración y despliegue

Esta es la guía técnica ampliada. Para empezar rápido, usa primero [MANUAL_STARTUP.md](MANUAL_STARTUP.md).

## Arquitectura sencilla

```text
Usuario
  |
  v
frontend/  ->  API Express  ->  PostgreSQL
              backend/          Docker
```

- `frontend/`: aplicación Expo para web y celular.
- `backend/`: API Express, autenticación y reglas de negocio.
- PostgreSQL: base de datos ejecutada dentro de Docker.

## Puertos del proyecto

| Servicio | Puerto | Dirección |
| --- | ---: | --- |
| PostgreSQL | 5433 | Solo para el backend |
| API | 4001 | `http://localhost:4001` |
| Expo web | 8082 | `http://localhost:8082` |

Estos puertos son los configurados actualmente. Si los cambias, actualiza `backend/.env` y `frontend/.env.local`.

## Variables de entorno

El archivo `backend/.env.example` contiene una configuración lista para desarrollo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/tiKets?schema=public"
PORT=4001
NODE_ENV="development"
JWT_SECRET="tiKets-dev-secret"
CORS_ORIGINS="http://localhost:8082"
```

Cópialo una vez:

```powershell
Copy-Item backend\.env.example backend\.env
```

No publiques `backend/.env`. Puede contener claves y secretos.

Para web, el cliente usa por defecto `http://localhost:4001`. Para un celular usa la IP local de la computadora:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:4001
```

## Instalación limpia

Desde la raíz:

```powershell
npm install
npm --workspace backend run prisma:generate
```

Si una instalación quedó dañada:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend\node_modules -ErrorAction SilentlyContinue
npm install
```

## Base de datos y migraciones

Inicia PostgreSQL:

```powershell
npm --workspace backend run db:up
```

Aplica todas las migraciones existentes:

```powershell
npm --workspace backend exec prisma migrate deploy -- --schema=prisma/schema.prisma
```

Carga datos demo:

```powershell
npm --workspace backend run prisma:seed
```

Para crear una migración durante el desarrollo:

```powershell
cd backend
npx prisma migrate dev --name describe-el-cambio --schema=prisma/schema.prisma
cd ..
```

No borres la carpeta `backend/prisma/migrations`. Las migraciones permiten que todas las computadoras tengan la misma base de datos.

## Arranque manual

Usa tres terminales. Los comandos completos están en [MANUAL_STARTUP.md](MANUAL_STARTUP.md).

Terminal de API:

```powershell
npm run dev:backend
```

Terminal de Expo:

```powershell
cd frontend
npx expo start --web --port 8082 --offline
```

Nunca ejecutes Expo desde la raíz: el frontend oficial está dentro de `frontend/`.

## Validación de servicios

Salud de la API:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

Catálogos de movilidad:

```powershell
Invoke-RestMethod http://localhost:4001/api/parking
Invoke-RestMethod http://localhost:4001/api/buses
```

Comprobación general:

```powershell
npm run ops:check
```

## Pruebas y compilación

Backend:

```powershell
npm --workspace backend run build
npm --workspace backend test
```

Frontend:

```powershell
cd frontend
npx tsc --noEmit -p tsconfig.json
npx expo export --platform web
```

## Datos demo y referencias externas

El seed incluye datos demostrativos inspirados en conceptos públicos de UrbaPark y EPMMOP:

- Parqueaderos con modalidad QR, tarjeta o ticket.
- Horarios de operación y tipos de vehículo.
- Terminales Quitumbe y Carcelén.
- Operadores, andenes, equipaje y viajes interprovinciales.

Estos datos no representan una afiliación, disponibilidad, tarifa u horario oficial. Para producción se necesitaría autorización e integración con cada operador, sensores o inventario real y un proveedor de pagos.

## Despliegue

Antes de producción:

1. Usa PostgreSQL administrado o un servidor protegido.
2. Define un `JWT_SECRET` largo y privado.
3. Configura `CORS_ORIGINS` con los dominios reales.
4. Completa la integración de pagos.
5. Sustituye el seed demo por datos autorizados.
6. Genera los builds finales de Android y web.
7. No uses `admin@tikets.com` ni `demo1234` en producción.

La aplicación actualmente usa pago demo y tickets QR para pruebas.
