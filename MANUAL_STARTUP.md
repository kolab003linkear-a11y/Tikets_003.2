# TiKetSafe: guía de arranque rápido

Esta guía explica cómo levantar el proyecto en Windows con PowerShell.

## 1. Requisitos

Instala lo siguiente:

- Node.js 20 o superior
- npm 10 o superior
- Docker Desktop
- Git

Verifica que estén disponibles:

```powershell
node --version
npm --version
docker --version
git --version
```

## 2. Clonar y preparar el proyecto

Desde PowerShell:

```powershell
cd "$HOME\Desktop"
git clone <url-del-repositorio>
cd Tikets_003.2
npm install
```

Crea el archivo de configuración del backend:

```powershell
Copy-Item backend\.env.example backend\.env
```

Si ya existe el proyecto, solo usa:

```powershell
cd "$HOME\Desktop\Tikets_003.2"
```

## 3. Preparar PostgreSQL y Prisma

Ejecuta estas instrucciones una sola vez:

```powershell
npm --workspace backend run db:up
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed
```

Esto levanta PostgreSQL, genera el cliente Prisma y crea datos demo.

## 4. Ejecutar la API

Abre una terminal en la raíz del proyecto:

```powershell
npm run dev:backend
```

La API queda en:

```text
http://localhost:4001
```

Puedes comprobarla con:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

## 5. Ejecutar la app web

En otra terminal:

```powershell
npm run dev:frontend
```

La aplicación web queda en:

```text
http://localhost:8082
```

## 6. Administrador de pruebas

En la app, entra a Perfil y usa la opción de acceso administrativo.

```text
Correo: admin@tikets.com
Contraseña: demo1234
```

## 7. Ejecutar en móvil

Para probar en un celular, configura la URL del backend en `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:4001
```

Busca tu IP local con:

```powershell
ipconfig
```

Luego inicia la app con:

```powershell
cd frontend
npx expo start
```

## 8. Deteener servicios

Para cerrar la API y Expo:

```text
Ctrl + C
```

Para apagar PostgreSQL:

```powershell
npm --workspace backend run db:down
```

## 9. Solución de problemas

### `ERR_CONNECTION_REFUSED`

Revisa si la API está corriendo:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

### `Failed to fetch`

Verifica que `CORS_ORIGINS` del backend incluya la URL del frontend y que la API esté levantada.

### Docker no inicia

Abre Docker Desktop y espera a que esté activo antes de volver a ejecutar:

```powershell
npm --workspace backend run db:up
```

### Puerto ocupado

```powershell
Get-NetTCPConnection -LocalPort 4001,8082 -ErrorAction SilentlyContinue
```

## 10. Comandos útiles

```powershell
npm --workspace backend run build
npm --workspace backend test
npm run ops:check
```

Puedes actualizar los datos demo desde `backend/prisma/seed.ts` y volver a ejecutar:

```powershell
npm --workspace backend run prisma:seed
```
