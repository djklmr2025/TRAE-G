param(
  [string]$InstallDir = "$env:USERPROFILE\ArkaiosLab",
  [string]$ManifestUrl = "https://raw.githubusercontent.com/djklmr2025/TRAE-G/main/arkaios-manifest.json",
  [switch]$SkipBuild,
  [switch]$Launch,
  [switch]$AdminMode
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Command([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Resolve-TemplatePath([string]$Value) {
  return $Value.Replace("%USERPROFILE%", $env:USERPROFILE)
}

function Invoke-SafeGitCloneOrPull([string]$Url, [string]$Target) {
  if (Test-Path -LiteralPath (Join-Path $Target ".git")) {
    Write-Host "Actualizando: $Target"
    git -C $Target pull --ff-only
    return
  }

  if (Test-Path -LiteralPath $Target) {
    Write-Host "Existe carpeta sin .git, se conserva: $Target" -ForegroundColor Yellow
    return
  }

  Write-Host "Clonando: $Url"
  git clone $Url $Target
}

if ($AdminMode) {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    throw "AdminMode fue solicitado, pero PowerShell no está elevado. Abre PowerShell como Administrador y vuelve a ejecutar."
  }
  Write-Host "AdminMode activo. Las acciones se registran y no se ejecutan borrados destructivos." -ForegroundColor Yellow
}

Write-Host "=== Arkaios Sovereign Lab Bootstrapper ===" -ForegroundColor Green
Write-Host "Instalación destino: $InstallDir"

if (-not (Test-Command git)) { throw "Falta Git. Instala Git y vuelve a ejecutar." }
if (-not (Test-Command node)) { throw "Falta Node.js. Instala Node.js 20+ y vuelve a ejecutar." }
if (-not (Test-Command npm)) { throw "Falta npm. Instala Node.js completo y vuelve a ejecutar." }

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$logPath = Join-Path $InstallDir "arkaios-install.log"
"[$(Get-Date -Format o)] Bootstrap iniciado en $InstallDir" | Out-File -LiteralPath $logPath -Encoding UTF8 -Append

Write-Step "Cargando manifest"
$manifestFile = Join-Path $InstallDir "arkaios-manifest.json"
try {
  Invoke-RestMethod -Uri $ManifestUrl -OutFile $manifestFile
} catch {
  $localManifest = Join-Path $PSScriptRoot "arkaios-manifest.json"
  if (Test-Path -LiteralPath $localManifest) {
    Copy-Item -LiteralPath $localManifest -Destination $manifestFile -Force
  } else {
    throw "No se pudo descargar manifest y no existe manifest local."
  }
}

$manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json

Write-Step "Instalando/actualizando repos"
foreach ($repo in $manifest.repos) {
  $target = Join-Path $InstallDir $repo.path
  try {
    Invoke-SafeGitCloneOrPull -Url $repo.url -Target $target
    "[$(Get-Date -Format o)] Repo OK: $($repo.id) -> $target" | Out-File -LiteralPath $logPath -Encoding UTF8 -Append
  } catch {
    "[$(Get-Date -Format o)] Repo ERROR: $($repo.id) -> $($_.Exception.Message)" | Out-File -LiteralPath $logPath -Encoding UTF8 -Append
    if ($repo.required) { throw }
    Write-Host "No se pudo preparar repo opcional $($repo.id): $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

if (-not $SkipBuild) {
  Write-Step "Instalando dependencias y compilando LAB principal"
  $mainLab = Join-Path $InstallDir "TRAE-G"
  if (Test-Path -LiteralPath (Join-Path $mainLab "package.json")) {
    npm --prefix $mainLab install
    npm --prefix $mainLab run build
  }
}

Write-Step "Creando lanzadores locales"
$launcher = Join-Path $InstallDir "ARKAIOS_LAB_LOCAL.cmd"
Set-Content -LiteralPath $launcher -Encoding ASCII -Value @"
@echo off
setlocal
cd /d "%~dp0TRAE-G"
set ARKAIOS_WORKSPACE=%~dp0
npm run local
"@

$openFolder = Join-Path $InstallDir "ABRIR_CARPETA_ARKAIOS.cmd"
Set-Content -LiteralPath $openFolder -Encoding ASCII -Value @"
@echo off
explorer "%~dp0"
"@

Write-Step "Resultado"
Write-Host "Instalado en: $InstallDir" -ForegroundColor Green
Write-Host "Lanzador: $launcher"
Write-Host "Log: $logPath"
Write-Host ""
Write-Host "Para ejecutar después:"
Write-Host "  $launcher"

if ($Launch) {
  Write-Step "Lanzando Arkaios LAB local"
  Start-Process -FilePath $launcher -WorkingDirectory $InstallDir
}
