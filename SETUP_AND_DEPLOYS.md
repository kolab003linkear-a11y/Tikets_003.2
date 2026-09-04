# TiKetSafe: guía de configuración y despliegue

Esta guía presenta el flujo recomendado para instalar, ejecutar y verificar el proyecto en Windows con PowerShell.

## 1. Requisitos previos

- Node.js 20+
- npm 10+
- Docker Desktop
- Git
- Visual Studio Code

## 2. Clonar el repositorio

```powershell
cd "$HOME\Desktop"
git clone <url-del-repositorio>
cd Tikets_003.2
code .
```

## 3. Instalar dependencias

```powershell
npm install
```

## 4. Configurar el backend

Crea el archivo de entorno:

```powershell
Copy-Item backend\.env.example backend\.env
```

El contenido recomendado es:

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

## 5. Preparar la base de datos

```powershell
npm --workspace backend run db:up
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed
```

## 6. Levantar la API

```powershell
npm run dev:backend
```

La API responderá en:

```text
http://localhost:4001
```

Comprobación:

```powershell
Invoke-RestMethod http://localhost:4001/api/health
```

## 7. Levantar la aplicación frontend

```powershell
npm run dev:frontend
```

La app web se abre en:

```text
http://localhost:8082
```

## 8. Probar el acceso de administrador

En la pantalla de Perfil, usa la opción de administración:

```text
Correo: admin@tikets.com
Contraseña: demo1234
```

## 9. Deteener el entorno

```powershell
npm --workspace backend run db:down
```

Y en cada terminal que esté ejecutando la API o Expo, usa `Ctrl + C`.

## 10. Validaciones útiles

```powershell
npm --workspace backend run build
npm --workspace backend test
npm run ops:check
```

## 11. Configuración para móvil

En `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:4001
```

Luego arrancas la app con:

```powershell
cd frontend
npx expo start
```

## 12. Problemas frecuentes

### Backend no responde

- Revisa que Docker esté arrancado.
- Comprueba `backend/.env`.
- Verifica `http://localhost:4001/api/health`.

### Frontend no carga

- Asegúrate de que la API esté levantada.
- Revisa que `CORS_ORIGINS` permita `http://localhost:8082`.
- Si hace falta, limpia la caché de Expo.

### Puerto ocupado

```powershell
Get-NetTCPConnection -LocalPort 4001,8082 -ErrorAction SilentlyContinue
```

## 13. Notas de despliegue

Este proyecto está pensado para desarrollo local y pruebas. Para un despliegue real, se recomienda:

- usar un secreto JWT fuerte en producción,
- configurar PostgreSQL con credenciales reales,
- proteger webhooks con firma HMAC real,
- validar el origen de CORS y la red interna/externa del entorno.
