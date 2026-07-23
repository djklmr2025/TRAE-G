# Arkaios Sovereign Agent / LAB local

## Estado real

Arkaios puede operar como LAB local con acceso a archivos reales mediante el servidor local incluido en TRAE-G.

El objetivo correcto no es copiar la sesión privada de otro agente, sino crear un runtime local propio:

```text
UI Arkaios / Chat
  -> servidor local 127.0.0.1
  -> workspace real
  -> herramientas: archivos, PowerShell, WSL, Termux/ADB, Git
  -> agentes/modelos mediante proveedores permitidos
```

## Instalación tipo bootstrapper

Comando recomendado cuando `install.ps1` esté publicado en `main`:

```powershell
irm https://raw.githubusercontent.com/djklmr2025/TRAE-G/main/install.ps1 | iex
```

Comando local para probar desde el repo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -InstallDir "$env:USERPROFILE\ArkaiosLab" -Launch
```

## Permisos reales

El LAB local puede tocar archivos reales del workspace elegido. El modo administrador/root queda separado:

- no se activa oculto;
- requiere PowerShell elevado;
- debe registrar acciones;
- no debe ejecutar borrados destructivos amplios;
- debe mostrar carpeta objetivo.

## Codex/OpenAI dentro de Antigravity

En esta máquina se detectó la extensión oficial:

```text
C:\Users\djklm\.antigravity\extensions\openai.chatgpt-26.601.20914-win32-x64
```

Contiene binarios como:

```text
bin\windows-x86_64\codex.exe
```

Y webview/assets relacionados con autenticación oficial de ChatGPT/Codex.

Conclusión técnica:

- Sí se puede detectar y lanzar herramientas oficiales si están instaladas.
- No se deben copiar tokens, cookies, sesiones ni credenciales.
- Para “invocar Codex” legalmente, el usuario debe estar autenticado por el flujo oficial de OpenAI/ChatGPT.
- Arkaios puede funcionar como orquestador local y, si Codex CLI está disponible y autenticado, invocarlo como herramienta externa.

## Piezas locales útiles detectadas en `C:\ARKAIOS`

- `TRAE-AGENT-ARKAIOS`: UI/LAB local base.
- `ARKAIOS-Agent-Core-main`: núcleo posible de agente.
- `arkaios-service-proxy-main`: proxy/ruta de modelos.
- `OmniRoute`: router avanzado de proveedores/modelos.
- `puter-internetOS`: base OS/LAB web.
- `UI-TARS`: posible control visual/desktop.
- `arkaios-desktop-control`: posible control del PC anfitrión.
- `neuralagentAI-main` y `arkaios-neural-agent-main`: candidatos para integrar lógica neural/agente.
- `agent-bridge`: messenger local auditable entre agentes. Incluye CLI, MCP, daemon, salas council y bootstrap `bridge-bootstrap.ps1`.

## NeuralAgent + Puter por PowerShell

Validación real al 2026-07-22:

- `C:\ARKAIOS\arkaios-neural-agent-main` sí es el NeuralAgent real. Incluye backend FastAPI, bridge local, desktop Electron, Puter Home, eyes/hands y release instalable.
- `C:\ARKAIOS\Agente Autonomo MVP\arkaios_virtual_body_v1` sí tiene runtime real alternativo: FastAPI en `127.0.0.1:8787`.
- `C:\ARKAIOS\puter-internetOS` sí tiene runtime real: Node/npm con `npm start`, URL esperada `http://puter.localhost:4100`.
- `C:\ARKAIOS\neuralagentAI-main` existe, pero está vacío; no se usa como dependencia activa.

No hacen falta los tres repos para autoejecutar una prueba básica:

1. Para NeuralAgent real: arrancar `arkaios-neural-agent-main`.
2. Para cuerpo/agente local ligero: arrancar Virtual Body.
3. Para interfaz tipo OS/LAB: arrancar Puter Internet OS.
4. `neuralagentAI-main` queda descartado como carpeta vacía/legacy.

Bootstrap incluido:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StatusOnly
```

Arrancar solo Virtual Body:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartVirtualBody -LaunchBrowser
```

Arrancar NeuralAgent completo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralAgent -LaunchBrowser
```

Arrancar NeuralAgent Core:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralCore -LaunchBrowser
```

Arrancar NeuralAgent Puter Bridge:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartNeuralPuterBridge -LaunchBrowser
```

Arrancar solo Puter:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartPuter -LaunchBrowser
```

Arrancar ambos:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\neural-puter\neural-puter-bootstrap.ps1 -StartPuter -StartVirtualBody -LaunchBrowser
```

El bootstrap no instala autorun, no abre puertos externos y no habilita acciones destructivas. Virtual Body solo escucha en `127.0.0.1` y mantiene confirmación para mouse/teclado/acciones de bridge.

Puertos esperados:

- NeuralAgent backend/bridge: `http://127.0.0.1:8000/local-bridge`
- NeuralAgent eyes/hands: `http://127.0.0.1:8001`
- NeuralAgent Puter Home: `http://127.0.0.1:4177`
- Puter Internet OS: `http://puter.localhost:4100`
- Virtual Body ligero: `http://127.0.0.1:8787`

## Siguiente fase recomendada

Crear un `tool-router` interno para que el chat pueda pedir acciones estructuradas:

```json
{
  "tool": "write_file",
  "path": "C:\\ARKAIOS\\proyecto\\archivo.txt",
  "content": "..."
}
```

El router decide si ejecuta, pide confirmación o rechaza según permisos.

## Agent Bridge

El bridge local detectado está en:

```text
C:\ARKAIOS\agent-bridge
```

Validación:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\ARKAIOS\agent-bridge\bridge-bootstrap.ps1 -StatusOnly
```

Ejecutar daemon en primer plano:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\ARKAIOS\agent-bridge\bridge-bootstrap.ps1 -Daemon
```

Instalar autorun explícito:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\ARKAIOS\agent-bridge\bridge-bootstrap.ps1 -InstallAutorun
```

Nota: `C:\ARKAIOS\whats app` se detectó como export/backup de WhatsApp con texto y media, no como ejecutable de puente.
