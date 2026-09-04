$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $root 'backend/logs'
$logFile = Join-Path $logDirectory 'operations.log'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

function Write-OperationLog($level, $message, $details = '') {
  $line = "$(Get-Date -Format o) [$level] $message $details".TrimEnd()
  [System.IO.File]::AppendAllText($logFile, "$line`r`n", [System.Text.UTF8Encoding]::new($false))
  Write-Output $line
}

Write-OperationLog 'INFO' 'Operations check started'

$projectProcesses = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*Tikets_003*' })
if ($projectProcesses.Count -eq 0) { Write-OperationLog 'INFO' 'Project processes' 'none' }
else { Write-OperationLog 'INFO' 'Project processes' "$($projectProcesses.Count) active" }

foreach ($port in @(4001, 8082, 5433)) {
  $listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  if ($listeners.Count -gt 0) { Write-OperationLog 'INFO' "Port $port" "active pid=$($listeners[0].OwningProcess)" }
  else { Write-OperationLog 'WARN' "Port $port" 'not listening' }
}

$container = docker ps --filter 'name=tiKets-postgres-0032' --format '{{.Names}} {{.Status}}' 2>$null
if ($container) { Write-OperationLog 'INFO' 'PostgreSQL container' $container }
else { Write-OperationLog 'WARN' 'PostgreSQL container' 'not running' }

Push-Location (Join-Path $root 'backend')
$migrationOutput = npx prisma migrate status --schema=prisma/schema.prisma 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
  $migrationSummary = if ($migrationOutput -match 'up to date') { 'database schema is up to date' } else { 'migration status command passed' }
  Write-OperationLog 'INFO' 'Prisma migrations' $migrationSummary
}
else { Write-OperationLog 'ERROR' 'Prisma migrations check failed' (($migrationOutput -replace '\s+', ' ').Trim()) }
Pop-Location

try {
  $health = Invoke-RestMethod -Uri 'http://localhost:4001/api/health' -TimeoutSec 5
  Write-OperationLog 'INFO' 'Backend health' ("ok=$($health.ok) database=$($health.database)")
} catch { Write-OperationLog 'ERROR' 'Backend health failed' $_.Exception.Message }

try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8082' -TimeoutSec 5
  Write-OperationLog 'INFO' 'Frontend health' "http=$($response.StatusCode)"
} catch { Write-OperationLog 'WARN' 'Frontend health failed' $_.Exception.Message }

Push-Location $root
$dependencyOutput = npm ls --workspaces --depth=0 --omit=optional 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) { Write-OperationLog 'INFO' 'Dependencies' 'npm ls passed' }
else { Write-OperationLog 'WARN' 'Dependencies check' (($dependencyOutput -replace '\s+', ' ').Trim()) }
Pop-Location

Write-OperationLog 'INFO' 'Operations check finished'
