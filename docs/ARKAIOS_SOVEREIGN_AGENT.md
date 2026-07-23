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
