# TRAE-G Arkaios

TRAE-G Arkaios es una versión portable de escritorio para Windows con chat Arkaios, editor y terminal local integrada.

## Release funcional

La versión local real ya funciona como paquete portable.

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

También expone el puente local de terminal para PowerShell/WSL desde la interfaz.

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

