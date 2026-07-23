# TRAE-G Arkaios

TRAE-G Arkaios es una versión portable de escritorio para Windows con chat Arkaios, editor y terminal local integrada.

## Release funcional

La versión local real ya funciona como paquete portable.

Versión portable recomendada actual:

```text
TRAE-G_Arkaios_Local_Real_v1.0.7.zip
```

Para instalar/usar desde GitHub Releases descarga el `.zip` completo del release, extráelo en una carpeta y ejecuta:

```text
TRAE-G.exe
```

No copies solo el `.exe`. Este empaquetado Electron/Nativefier necesita ir acompañado por:

- `resources/`
- `locales/`
- DLLs y archivos `.pak/.dat`

## API key

API key de usuario: no se necesita.

El flujo principal usa Puter AI con el login propio del usuario. Si Puter no está disponible, el sistema conserva un respaldo técnico por Arkaios Service Proxy para entornos owner/locales, pero el usuario final no debe pegar llaves ni configurar secretos.

## Workspace virtual web

La versión web/Vercel puede trabajar con proyectos virtuales generados dentro de la interfaz.

Funciones disponibles:

- Crear archivos virtuales desde la respuesta del agente.
- Descargar el workspace virtual como `.zip`.
- Publicar el workspace virtual en GitHub con autorización del usuario.
- Detectar intención del borrador en modo local de navegador antes de enviar.
- Guardar sesión de chat por usuario/navegador.
- Descargar `.log` de la conversación e interacciones.
- Usar memoria corta/larga local y memoria remota opcional.

Límite honesto:

- La web no puede escribir directo en `C:\ARKAIOS` ni en carpetas reales de Windows.
- Para archivos reales locales, usa la versión full/local portable.
- El borrador vivo no envía texto a IA ni a internet antes de presionar Enter; solo muestra una señal local de intención.

## Memoria

TRAE-G Arkaios guarda memoria de sesión en el navegador:

- `arkaios_session_id`: identifica la sesión local.
- `arkaios_chat_messages`: historial corto persistente.
- `arkaios_long_memory`: resumen local de preferencias e interacciones relevantes.

El botón de descarga del chat exporta un `.log` con:

- ID de sesión.
- Memoria local.
- Conversación.
- Lista de archivos virtuales del workspace.

Si el servidor tiene `SUPERMEMORY_API_KEY` o `VITE_SUPERMEMORY_API_KEY`, también puede sincronizar memoria remota mediante `/api/memory`. La llave se usa del lado servidor/local y no se imprime en la UI.

### Publicar en GitHub

El botón `GitHub` puede crear un repositorio y subir los archivos virtuales usando la API oficial de GitHub.

GitHub sí requiere autorización del usuario. El token se pide en pantalla, se usa en memoria para esa operación y no se guarda en el proyecto.

## Modo local real

Al abrir `TRAE-G.exe`, la app carga:

```text
http://127.0.0.1:8787/
```

El runtime arranca el servidor local incluido en:

```text
resources/app/local/arkaios-local-server.mjs
```

Ese servidor sirve la UI compilada desde:

```text
resources/app/dist
```

También expone el puente local de terminal desde la interfaz.

Funciones locales reales:

- `Add Folder`: selecciona una carpeta real de Windows como workspace activo.
- Terminal PowerShell: ejecuta comandos en el workspace activo.
- Terminal WSL/Linux: ejecuta `wsl.exe bash -lc` en el workspace activo.
- Terminal Termux/ADB: ejecuta `adb.exe shell` para dispositivos Android autorizados.

Nota de seguridad: el modo administrador/root no se ejecuta oculto ni automático. Si se agrega como fase avanzada, debe quedar con confirmación explícita, registro de acciones y alcance visible para el usuario.

## Ejecutar desde código fuente

```bash
npm install
npm run build
npm run local
```

En Windows también puedes usar:

```bat
ARRANCAR_ARKAIOS_LOCAL.cmd
```

## Bootstrapper Arkaios

El repo incluye un instalador seguro tipo `irm | iex` para desplegar el LAB local desde GitHub:

```powershell
irm https://raw.githubusercontent.com/djklmr2025/TRAE-G/main/install.ps1 | iex
```

También puede probarse localmente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -InstallDir "$env:USERPROFILE\ArkaiosLab" -Launch
```

El manifest de módulos está en:

```text
arkaios-manifest.json
```

Documentación técnica:

```text
docs/ARKAIOS_SOVEREIGN_AGENT.md
```

## Empaquetado

El artefacto de release debe ser un `.zip` completo del paquete portable, no solo el binario.

Ejemplo de estructura:

```text
TRAE-G_Arkaios_Local_Real_v1.0.1/
  TRAE-G.exe
  resources/
  locales/
  ffmpeg.dll
  icudtl.dat
  resources.pak
  ...
```

## Estado

- UI web/local compilada con Vite.
- Puter AI configurado como flujo principal sin API key del usuario.
- Servidor local portable preparado para empaquetado.
- Terminal local conectada vía servidor `127.0.0.1`.
- Release recomendado: descargar y extraer el `.zip` completo.
