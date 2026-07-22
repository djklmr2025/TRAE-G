@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=node"
if exist "C:\ARKAIOS\.tools\node-v22.23.1-win-x64\node.exe" (
  set "NODE_EXE=C:\ARKAIOS\.tools\node-v22.23.1-win-x64\node.exe"
)

echo ==============================
echo Arkaios Local IDE
echo ==============================
echo.

if not exist "dist\index.html" (
  echo Construyendo frontend...
  call npm run build
  if errorlevel 1 (
    echo Build fallido.
    pause
    exit /b 1
  )
)

start "" "http://127.0.0.1:8787"
"%NODE_EXE%" local\arkaios-local-server.mjs

pause
