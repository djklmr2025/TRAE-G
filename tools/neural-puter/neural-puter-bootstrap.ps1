param(
    [switch]$StatusOnly,
    [switch]$StartPuter,
    [switch]$StartVirtualBody,
    [switch]$StartNeuralAgent,
    [switch]$StartNeuralCore,
    [switch]$StartNeuralPuterBridge,
    [switch]$LaunchBrowser,
    [switch]$AllowDesktopControl
)

$ErrorActionPreference = "Stop"

$arkaiosRoot = "C:\ARKAIOS"
$neuralAgentDir = Join-Path $arkaiosRoot "arkaios-neural-agent-main"
$emptyNeuralAgentDir = Join-Path $arkaiosRoot "neuralagentAI-main"
$puterDir = Join-Path $arkaiosRoot "puter-internetOS"
$virtualBodyDir = Join-Path $arkaiosRoot "Agente Autonomo MVP\arkaios_virtual_body_v1"
$puterNodeHome = Join-Path $arkaiosRoot ".tools\node-v22.23.1-win-x64"

function Write-Section($text) {
    Write-Host ""
    Write-Host "=== $text ==="
}

function Test-Port($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(300)
        if ($ok) { $client.EndConnect($async) }
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Get-DirCount($path) {
    if (!(Test-Path -LiteralPath $path)) { return -1 }
    return (Get-ChildItem -LiteralPath $path -Force -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
}

Write-Section "Arkaios Neural + Puter Bootstrap"

$neuralCount = Get-DirCount $neuralAgentDir
$emptyNeuralCount = Get-DirCount $emptyNeuralAgentDir
$puterExists = Test-Path -LiteralPath (Join-Path $puterDir "package.json")
$virtualBodyExists = Test-Path -LiteralPath (Join-Path $virtualBodyDir "main.py")
$neuralRepoExists = Test-Path -LiteralPath (Join-Path $neuralAgentDir "ARRANCAR_NEURALAGENT_COMPLETO.bat")
$neuralCoreScript = Join-Path $neuralAgentDir "tools\start-arkaios-core.ps1"
$neuralBridgeBat = Join-Path $neuralAgentDir "ARRANCAR_PUTER_BRIDGE.bat"
$neuralDevBat = Join-Path $neuralAgentDir "ARRANCAR_NEURALAGENT_DEV.bat"

Write-Host "arkaios-neural-agent-main: $neuralAgentDir"
if ($neuralCount -eq -1) {
    Write-Host "  Estado: no existe."
} elseif ($neuralCount -eq 0) {
    Write-Host "  Estado: carpeta vacia; no se usara como dependencia activa."
} else {
    Write-Host "  Estado: listo; contiene $neuralCount elementos y scripts NeuralAgent."
}

Write-Host "neuralagentAI-main legacy: $emptyNeuralAgentDir"
if ($emptyNeuralCount -eq -1) {
    Write-Host "  Estado: no existe."
} elseif ($emptyNeuralCount -eq 0) {
    Write-Host "  Estado: carpeta vacia; no se usara."
} else {
    Write-Host "  Estado: contiene $emptyNeuralCount elementos; revisar manualmente antes de usar."
}

Write-Host "puter-internetOS: $puterDir"
Write-Host "  Estado: $(if ($puterExists) { 'listo' } else { 'faltan archivos/package.json' })"

Write-Host "Virtual Body: $virtualBodyDir"
Write-Host "  Estado: $(if ($virtualBodyExists) { 'listo' } else { 'faltan archivos/main.py' })"

Write-Host "Puerto Puter esperado 4100: $(if (Test-Port 4100) { 'activo' } else { 'apagado' })"
Write-Host "Puerto Virtual Body esperado 8787: $(if (Test-Port 8787) { 'activo' } else { 'apagado' })"
Write-Host "Puerto NeuralAgent backend esperado 8000: $(if (Test-Port 8000) { 'activo' } else { 'apagado' })"
Write-Host "Puerto NeuralAgent eyes/hands esperado 8001: $(if (Test-Port 8001) { 'activo' } else { 'apagado' })"
Write-Host "Puerto NeuralAgent Puter Home esperado 4177: $(if (Test-Port 4177) { 'activo' } else { 'apagado' })"

if ($StatusOnly) {
    Write-Host ""
    Write-Host "StatusOnly activo. No se arranco ningun servicio."
    exit 0
}

if ($StartPuter) {
    if (!$puterExists) {
        throw "No se puede arrancar Puter: falta package.json en $puterDir"
    }

    Write-Section "Arrancando Puter Internet OS"
    $puterCmd = @"
Set-Location -LiteralPath '$puterDir'
`$env:NODE_HOME = '$puterNodeHome'
`$env:PATH = "`$env:NODE_HOME;`$env:PATH"
npm start
"@
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $puterCmd -WindowStyle Normal
    Write-Host "Puter solicitado. URL esperada: http://puter.localhost:4100"
}

if ($StartNeuralAgent) {
    if (!$neuralRepoExists) {
        throw "No se puede arrancar NeuralAgent completo: falta ARRANCAR_NEURALAGENT_COMPLETO.bat en $neuralAgentDir"
    }

    Write-Section "Arrancando NeuralAgent completo"
    Start-Process -FilePath (Join-Path $neuralAgentDir "ARRANCAR_NEURALAGENT_COMPLETO.bat") -WorkingDirectory $neuralAgentDir -WindowStyle Normal
    Write-Host "NeuralAgent completo solicitado. Backend esperado: http://127.0.0.1:8000"
    Write-Host "Puter Home esperado: http://127.0.0.1:4177"
}

if ($StartNeuralCore) {
    if (!(Test-Path -LiteralPath $neuralCoreScript)) {
        throw "No se puede arrancar Neural Core: falta $neuralCoreScript"
    }

    Write-Section "Arrancando NeuralAgent Core"
    $coreCmd = @"
Set-Location -LiteralPath '$neuralAgentDir'
powershell -NoProfile -ExecutionPolicy Bypass -File '$neuralCoreScript' -Restart -OpenPuter
"@
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $coreCmd -WindowStyle Normal
    Write-Host "Neural Core solicitado. Bridge esperado: http://127.0.0.1:8000/local-bridge"
}

if ($StartNeuralPuterBridge) {
    if (!(Test-Path -LiteralPath $neuralBridgeBat)) {
        throw "No se puede arrancar Neural Puter Bridge: falta $neuralBridgeBat"
    }

    Write-Section "Arrancando NeuralAgent Puter Bridge"
    Start-Process -FilePath $neuralBridgeBat -WorkingDirectory $neuralAgentDir -WindowStyle Normal
    Write-Host "Neural Puter Bridge solicitado. Backend esperado: http://127.0.0.1:8000"
    Write-Host "Eyes/Hands esperado: http://127.0.0.1:8001/viewer"
    Write-Host "Puter Home esperado: http://127.0.0.1:4177"
}

if ($StartVirtualBody) {
    if (!$virtualBodyExists) {
        throw "No se puede arrancar Virtual Body: falta main.py en $virtualBodyDir"
    }

    Write-Section "Arrancando ARKAIOS Virtual Body"
    $controlNote = if ($AllowDesktopControl) { "Control de escritorio permitido por bandera." } else { "Control de escritorio queda bajo confirmacion del safety_guard." }
    Write-Host $controlNote

    $bodyCmd = @"
Set-Location -LiteralPath '$virtualBodyDir'
if (!(Test-Path -LiteralPath '.venv')) { py -3.12 -m venv .venv }
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
"@
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $bodyCmd -WindowStyle Normal
    Write-Host "Virtual Body solicitado. API esperada: http://127.0.0.1:8787/docs"
}

if ($LaunchBrowser) {
    if ($StartNeuralPuterBridge -or (Test-Port 4177)) {
        Start-Process "http://127.0.0.1:4177"
    } elseif ($StartNeuralCore -or (Test-Port 4100)) {
        Start-Process "http://puter.localhost:4100/app/arkaios"
    } elseif ($StartPuter -or (Test-Port 4100)) {
        Start-Process "http://puter.localhost:4100"
    } elseif ($StartNeuralAgent -or (Test-Port 8000)) {
        Start-Process "http://127.0.0.1:8000/docs"
    } elseif ($StartVirtualBody -or (Test-Port 8787)) {
        Start-Process "http://127.0.0.1:8787/docs"
    } else {
        Write-Host "LaunchBrowser omitido: no hay puerto activo detectado."
    }
}

Write-Section "Resumen"
Write-Host "Uso basico:"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StatusOnly"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralAgent -LaunchBrowser"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralCore -LaunchBrowser"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralPuterBridge -LaunchBrowser"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartVirtualBody -LaunchBrowser"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartPuter -LaunchBrowser"
