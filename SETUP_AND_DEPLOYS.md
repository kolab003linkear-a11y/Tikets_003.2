# TiKetSafe: guía de configuración

Sigue los pasos en orden. Esta guía es para Windows y PowerShell.

## Antes de empezar

Instala:

- Node.js 20 o superior: https://nodejs.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Git: https://git-scm.com/downloads

Abre Docker Desktop y espera a que termine de iniciar.

## Paso 1: abrir VSC y clonar el repositorio

1. Abre **Visual Studio Code (VSC)**
2. Abre la terminal integrada: `Ctrl + `` (backtick) o menú **Terminal → New Terminal**
3. Asegúrate de que sea **PowerShell** (si no, haz clic en el dropdown de la terminal y selecciona PowerShell)

Ve al Escritorio:

```powershell
cd "$HOME\Desktop"
```

Clona el repositorio:

```powershell
git clone https://github.com/kolab003linkear-a11y/Tikets_003.2.git
```

Entra a la carpeta descargada:

```powershell
cd Tikets_003.2
```

Abre esta carpeta en VSC: `File → Open Folder` o ejecuta en la terminal:

```powershell
code .
```

Comprueba que estás en la carpeta correcta:

```powershell
Get-ChildItem
```

Debes ver las carpetas `backend` y `frontend`, además de archivos como `README.md` y `package.json`.

> Si ya clonaste el repositorio antes, no repitas `git clone`. Usa `cd "$HOME\Desktop\Tikets_003.2"`.

## Paso 2: instalar dependencias

Ejecuta una sola vez:

```powershell
npm install
npm --workspace backend run prisma:generate
```

## Paso 3: configurar el backend

Crea el archivo de configuración:

```powershell
Copy-Item backend\.env.example backend\.env
```

El archivo debe usar estos valores:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:55432/tiKets?schema=public"
PORT=4001
NODE_ENV="development"
JWT_SECRET="tiKets-dev-secret"
CORS_ORIGINS="http://localhost:8082"
```

No compartas el archivo `backend/.env`.

## Paso 4: preparar la base de datos

Ejecuta:

```powershell
npm --workspace backend run db:up
npm --workspace backend exec prisma migrate deploy -- --schema=prisma/schema.prisma
npm --workspace backend run prisma:seed
```

El último comando crea datos de prueba para Cartelera, Estadios, Parqueaderos y Buses.

## Paso 5: levantar la API

En la terminal de VSC, ejecuta:

```powershell
npm run dev:backend
```

No cierres esta terminal. La API se levantará en segundo plano.

La API debe funcionar en:

```text
http://localhost:4001
```

Para comprobarla, abre una nueva terminal en VSC: `Ctrl + Shift + `` (backtick) y ejecuta:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

La respuesta correcta debe mostrar:

```text
ok: True
database: connected
```

## Paso 6: levantar la aplicación

En una nueva terminal de VSC (o usa la terminal de verificación), entra a la carpeta `frontend` y ejecuta:

```powershell
cd frontend
npx expo start --web --port 8082 --offline
```

Es importante que estés en la carpeta `frontend` para ejecutar este comando.

Abre en el navegador:

```text
http://localhost:8082
```

## Paso 7: probar el acceso admin

En la aplicación:

1. Abre **Perfil**.
2. Pulsa la rueda de configuración.
3. Pulsa **Entrar como admin**.
4. Escribe estos datos:

```text
Correo: admin@tikets.com
Contraseña: demo1234
```

Estas credenciales solo sirven para pruebas locales.

## Paso 8: probar los módulos

En la barra inferior revisa:

- **Cartelera**: eventos y películas.
- **Estadios**: partidos y localidades.
- **Parqueaderos**: parqueaderos y espacios disponibles.
- **Buses**: rutas, viajes y asientos.
- **Mis Tickets**: tickets comprados.
- **Admin**: administración de eventos, estadios, parqueaderos y buses.

Los datos de parqueaderos, terminales, operadores y viajes son demostrativos. No son información oficial ni disponibilidad real.

## Paso 9: detener el proyecto

En la terminal de VSC donde corre la API y en la terminal donde corre Expo, presiona:

```text
Ctrl + C
```

Para detener PostgreSQL, en cualquier terminal ejecuta:

```powershell
npm --workspace backend run db:down
```

## Problemas comunes

### `ERR_CONNECTION_REFUSED`

Expo no está levantado. Ejecuta nuevamente el Paso 6.

### Pantalla blanca

Detén Expo con `Ctrl + C` en su terminal y ejecuta:

```powershell
cd frontend
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --web --port 8082 --offline
```

Después recarga el navegador con `Ctrl + Shift + R`.

### `Failed to fetch`

La API no está funcionando. Comprueba:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

Si falla, vuelve al Paso 5.

### Docker no inicia

Abre Docker Desktop y espera a que esté listo. Después ejecuta:

```powershell
npm --workspace backend run db:up
```

### El puerto está ocupado

Comprueba qué proceso usa los puertos:

```powershell
Get-NetTCPConnection -LocalPort 4001,8082,55432 -ErrorAction SilentlyContinue
```

Cierra la aplicación que esté usando el puerto y repite los pasos.

## Comandos opcionales para estudiantes

Compilar el backend:

```powershell
npm --workspace backend run build
```

Ejecutar las pruebas:

```powershell
npm --workspace backend test
```

Comprobar tipos del frontend:

```powershell
cd frontend
npx tsc --noEmit -p tsconfig.json
```

Comprobar todos los servicios:

```powershell
cd ..
npm run ops:check
```
