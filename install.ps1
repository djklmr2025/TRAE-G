param(
  [string]$InstallDir = "C:\ARKAIOS",
  [string]$ArchiveUrl = "https://github.com/djklmr2025/TRAE-G/releases/download/2026/ARKAIOS_FULL_LOCAL_v1.0.1_FINAL_20260722-214629_SOLID.rar",
  [string]$ExpectedSha256 = "A6E1A6BF148D84ADA03E935352AE32AACB0EC02DD7C3DB3974DF71F99F601683",
  [string]$LocalArchive = "",
  [switch]$Launch,
  [switch]$KeepTemp
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Find-RarTool {
  $candidates = @(
    "C:\Program Files\WinRAR\Rar.exe",
    "C:\Program Files\WinRAR\WinRAR.exe",
    "C:\Program Files (x86)\WinRAR\Rar.exe",
    "C:\Program Files (x86)\WinRAR\WinRAR.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return @{ Tool = $candidate; Kind = "rar" }
    }
  }

  $sevenZip = Get-Command 7z.exe -ErrorAction SilentlyContinue
  if ($sevenZip) {
    return @{ Tool = $sevenZip.Source; Kind = "7z" }
  }

  return $null
}

function Expand-RarArchive([string]$Archive, [string]$Destination, [hashtable]$Extractor) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  if ($Extractor.Kind -eq "rar") {
    & $Extractor.Tool x -y $Archive $Destination | Out-Null
  } elseif ($Extractor.Kind -eq "7z") {
    & $Extractor.Tool x "-o$Destination" -y $Archive | Out-Null
  } else {
    throw "Extractor no soportado: $($Extractor.Kind)"
  }

  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo extraer el RAR. Codigo: $LASTEXITCODE"
  }
}

function Copy-Merge([string]$Source, [string]$Destination) {
  if (!(Test-Path -LiteralPath $Source)) {
    throw "Fuente no existe: $Source"
  }

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  robocopy $Source $Destination /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
  $code = $LASTEXITCODE
  if ($code -gt 7) {
    throw "Robocopy fallo de $Source a $Destination con codigo $code"
  }
}

Write-Host "=== ARKAIOS FULL LOCAL Installer ===" -ForegroundColor Green
Write-Host "Destino: $InstallDir"

$extractor = Find-RarTool
if (!$extractor) {
  throw "Falta WinRAR o 7-Zip. Instala uno de los dos y vuelve a ejecutar."
}
Write-Host "Extractor: $($extractor.Tool)"

$tempRoot = Join-Path $env:TEMP ("arkaios-full-local-" + [Guid]::NewGuid().ToString("N"))
$downloadPath = Join-Path $tempRoot "ARKAIOS_FULL_LOCAL_v1.0.1_FINAL.rar"
$extractPath = Join-Path $tempRoot "extract"

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
  if ($LocalArchive) {
    Write-Step "Usando paquete local"
    if (!(Test-Path -LiteralPath $LocalArchive)) {
      throw "No existe LocalArchive: $LocalArchive"
    }
    Copy-Item -LiteralPath $LocalArchive -Destination $downloadPath -Force
  } else {
    Write-Step "Descargando paquete oficial"
    Write-Host $ArchiveUrl
    Invoke-WebRequest -Uri $ArchiveUrl -OutFile $downloadPath
  }

  Write-Step "Validando SHA256"
  $actualSha256 = (Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($actualSha256 -ne $ExpectedSha256.ToUpperInvariant()) {
    throw "SHA256 invalido. Esperado $ExpectedSha256 pero se obtuvo $actualSha256"
  }
  Write-Host "SHA256 OK: $actualSha256" -ForegroundColor Green

  Write-Step "Extrayendo paquete"
  Expand-RarArchive -Archive $downloadPath -Destination $extractPath -Extractor $extractor

  $payload = Get-ChildItem -LiteralPath $extractPath -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "arkaios-neural-agent-main") } |
    Select-Object -First 1

  if (!$payload) {
    throw "El paquete no contiene arkaios-neural-agent-main en la raiz esperada."
  }

  Write-Step "Instalando modulos en $InstallDir"
  Copy-Merge -Source (Join-Path $payload.FullName "arkaios-neural-agent-main") -Destination (Join-Path $InstallDir "arkaios-neural-agent-main")
  Copy-Merge -Source (Join-Path $payload.FullName "ELEMIA-v4-arkaios-main") -Destination (Join-Path $InstallDir "ELEMIA-v4-arkaios-main")
  Copy-Merge -Source (Join-Path $payload.FullName "puter-internetOS") -Destination (Join-Path $InstallDir "puter-internetOS")

  $launcher = Join-Path $InstallDir "arkaios-neural-agent-main\ARRANCAR_ARKAIOS_FULL_LOCAL.bat"
  if (!(Test-Path -LiteralPath $launcher)) {
    throw "No se encontro lanzador final: $launcher"
  }

  Write-Step "Instalacion lista"
  Write-Host "Lanzador: $launcher" -ForegroundColor Green
  Write-Host "Backend: http://127.0.0.1:8000"
  Write-Host "Eyes/Hands: http://127.0.0.1:8001"
  Write-Host "Puter OS: http://puter.localhost:4100"
  Write-Host "App: http://puter.localhost:4100/app/arkaios"

  if ($Launch) {
    Write-Step "Ejecutando ARKAIOS FULL LOCAL"
    Start-Process -FilePath $launcher -WorkingDirectory (Split-Path -Parent $launcher)
  }
} finally {
  if (!$KeepTemp -and (Test-Path -LiteralPath $tempRoot)) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
