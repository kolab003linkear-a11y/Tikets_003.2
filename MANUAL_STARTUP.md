# TiKetSafe: guía rápida para estudiantes

Esta guía explica cómo levantar el proyecto en Windows usando PowerShell.

## 1. Qué necesitas

Instala estos programas:

- Node.js 20 o superior: https://nodejs.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Git: https://git-scm.com/downloads

Después de instalar Docker Desktop, ábrelo y espera a que indique que está funcionando.

Comprueba las instalaciones:

```powershell
node --version
npm --version
docker --version
git --version
```

## 2. Descargar e instalar el proyecto

Abre PowerShell y entra a la carpeta del proyecto:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2"
```

Cambia `TU_USUARIO` por tu usuario de Windows.

Instala todas las dependencias:

```powershell
npm install
```

El proyecto tiene dos partes:

- `backend`: API, base de datos y reglas del sistema.
- `frontend`: aplicación que ve el usuario en web o celular.

## 3. Preparar el backend una sola vez

Copia la configuración de ejemplo:

```powershell
Copy-Item backend\.env.example backend\.env
```

Genera el cliente de Prisma, que permite al backend hablar con PostgreSQL:

```powershell
npm --workspace backend run prisma:generate
```

Levanta PostgreSQL y aplica las tablas:

```powershell
npm --workspace backend run db:up
npm --workspace backend exec prisma migrate deploy -- --schema=prisma/schema.prisma
npm --workspace backend run prisma:seed
```

El seed agrega datos de prueba para cartelera, estadios, parqueaderos y buses.

## 4. Levantar el sistema

Necesitas tres terminales de PowerShell. No cierres ninguna mientras estés probando.

### Terminal 1: base de datos

Si ya hiciste la preparación anterior, solo verifica que Docker esté activo:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2"
npm --workspace backend run db:up
```

### Terminal 2: API

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2"
npm run dev:backend
```

Debes ver que la API queda disponible en:

```text
http://localhost:4001
```

Compruébala desde una cuarta terminal, si quieres:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

La respuesta debe indicar `ok: true` y `database: connected`.

### Terminal 3: aplicación web

Es importante entrar a `frontend` antes de arrancar Expo. Así se evita cargar una versión antigua:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2\frontend"
npx expo start --web --port 8082 --offline
```

Abre esta dirección:

```text
http://localhost:8082
```

La aplicación actual incluye Cartelera, Estadios, Parqueaderos, Buses, Mis Tickets, Perfil y Admin.

## 5. Administrador de prueba

En Perfil abre el ícono de configuración y selecciona **Entrar como admin**.

```text
Correo: admin@tikets.com
Contraseña: demo1234
```

Son credenciales únicamente para desarrollo. No las uses en producción.

## 6. Probar en un celular

El celular y la computadora deben estar conectados a la misma red Wi-Fi.

En `frontend/.env.local`, configura la IP local de tu computadora:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:4001
```

Para conocer tu IP:

```powershell
ipconfig
```

Busca la dirección `IPv4` de tu adaptador Wi-Fi. Luego inicia Expo:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2\frontend"
npx expo start
```

Escanea el código QR con Expo Go.

## 7. Detener el sistema

En la terminal de la API y en la de Expo presiona:

```text
Ctrl + C
```

Para detener PostgreSQL:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2\backend"
docker compose down
```

## 8. Problemas frecuentes

### El navegador muestra `ERR_CONNECTION_REFUSED`

El servidor de Expo no está activo. Abre una terminal, entra a `frontend` y ejecuta:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2\frontend"
npx expo start --web --port 8082 --offline
```

### La pantalla aparece en blanco

Cierra Expo con `Ctrl + C`, borra la caché local y vuelve a iniciar:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2\frontend"
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --web --port 8082 --offline
```

Después recarga el navegador con `Ctrl + Shift + R`.

### La aplicación dice `Failed to fetch`

La API no está activa o el frontend apunta al puerto incorrecto. Comprueba:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

En web, el backend debe usar el puerto `4001`.

### Docker no inicia

Abre Docker Desktop, espera unos segundos y ejecuta:

```powershell
cd "C:\Users\TU_USUARIO\Desktop\Tikets_003.2"
npm --workspace backend run db:up
```

### Prisma indica que no puede conectarse

Comprueba que el contenedor esté activo:

```powershell
docker ps
```

Si no aparece `tiKets-postgres-0032`, ejecuta nuevamente `npm --workspace backend run db:up`.

### Un puerto está ocupado

Busca el proceso que usa el puerto:

```powershell
Get-NetTCPConnection -LocalPort 8082,4001 -ErrorAction SilentlyContinue
```

Cierra la terminal que inició ese proceso o reinicia el equipo antes de repetir los pasos.

## 9. Comprobación automática

Desde la raíz del proyecto:

```powershell
npm run ops:check
```

Este comando ayuda a revisar Docker, puertos, migraciones, API y frontend.

## 10. Comandos para estudiar el código

```powershell
npm --workspace backend run build
npm --workspace backend test
cd frontend
npx tsc --noEmit -p tsconfig.json
```

El backend contiene la lógica del servidor. El frontend contiene las pantallas. Puedes cambiar datos demo en `backend/prisma/seed.ts` y volver a ejecutar `npm --workspace backend run prisma:seed`.
