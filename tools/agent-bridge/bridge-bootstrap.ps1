param(
  [string]$BridgeDir = "C:\ARKAIOS\agent-bridge",
  [switch]$Daemon,
  [switch]$InstallAutorun,
  [switch]$StatusOnly
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Resolve-Python {
  $candidates = @(
    "C:\Python314\python.exe",
    "C:\Python313\python.exe",
    "C:\Python312\python.exe",
    "python.exe",
    "py.exe"
  )

  foreach ($candidate in $candidates) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }

  throw "No se encontró Python. Instala Python 3.12+ o ajusta BridgeDir/Python."
}

function Invoke-Bridge([string]$Python, [string[]]$ArgsList) {
  $script = Join-Path $BridgeDir "agent_bridge.py"
  & $Python $script @ArgsList
}

Write-Host "=== ARKAIOS Agent Bridge Bootstrap ===" -ForegroundColor Green
Write-Host "Bridge: $BridgeDir"

if (-not (Test-Path -LiteralPath $BridgeDir)) {
  throw "No existe BridgeDir: $BridgeDir"
}

$bridgeCli = Join-Path $BridgeDir "agent_bridge.py"
$daemonScript = Join-Path $BridgeDir "agent_bridge_daemon.py"
$autorunScript = Join-Path $BridgeDir "Install-AgentBridgeAutorun.ps1"

foreach ($required in @($bridgeCli, $daemonScript)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Falta archivo requerido: $required"
  }
}

$python = Resolve-Python
Write-Host "Python: $python"

Write-Step "Validando estado"
Invoke-Bridge -Python $python -ArgsList @("status")

if ($StatusOnly) {
  exit 0
}

if ($InstallAutorun) {
  if (-not (Test-Path -LiteralPath $autorunScript)) {
    throw "No existe instalador autorun: $autorunScript"
  }

  Write-Step "Instalando autorun con Scheduled Task"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $autorunScript
  exit 0
}

if ($Daemon) {
  Write-Step "Ejecutando daemon en primer plano"
  Write-Host "Ctrl+C detiene esta sesión. Para autorun usa -InstallAutorun."
  Set-Location -LiteralPath $BridgeDir
  & $python $daemonScript
  exit $LASTEXITCODE
}

Write-Step "Prueba directa de mensajería"
Invoke-Bridge -Python $python -ArgsList @(
  "send",
  "--from", "arkaios-bootstrap",
  "--to", "all",
  "--topic", "bridge-bootstrap",
  "--text", "Agent Bridge validado por bridge-bootstrap.ps1"
)

Write-Step "Inbox all"
Invoke-Bridge -Python $python -ArgsList @("inbox", "--agent", "all", "--limit", "5")

Write-Host ""
Write-Host "Bridge listo. Modos disponibles:"
Write-Host "  powershell -ExecutionPolicy Bypass -File $PSCommandPath -StatusOnly"
Write-Host "  powershell -ExecutionPolicy Bypass -File $PSCommandPath -Daemon"
Write-Host "  powershell -ExecutionPolicy Bypass -File $PSCommandPath -InstallAutorun"
