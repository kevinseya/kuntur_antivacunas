# Kuntur Antivacunas Frontend (React Native)

Aplicación móvil desarrollada en React Native + Expo para el sistema Kuntur Antivacunas. Permite a los usuarios registrar locales, visualizar y transmitir video/audio en tiempo real, recibir transcripciones y alertas, y gestionar la configuración de cámaras y ubicación.

## Características principales

- Registro de usuarios/locales con ubicación y datos de cámara.
- Streaming de video MJPEG y audio en tiempo real desde cámaras IP y micrófonos.
- Visualización de transcripciones y alertas en vivo (SSE).
- Mapa interactivo y componentes visuales personalizados.
- Hooks para manejo de usuario, cámara, streaming y transcripción.
- Temas y tipografías personalizadas.

## Estructura de carpetas

- `app/`         : Navegación y layout principal.
- `assets/`      : Imágenes, fuentes y recursos gráficos.
- `components/`  : Componentes reutilizables (audio, video, header, formularios, mapas).
- `constant/`    : Configuración de API, colores, tipografías.
- `hooks/`       : Hooks personalizados para lógica de usuario, cámara, streaming, transcripción.
- `services/`    : Servicios para registro de usuario y ubicación.

## Configuración inicial

1. **Instala dependencias:**
   ```bash
   npm install
   ```
2. **Configura las IPs de los servicios backend:**
   - Debes editar el archivo `constant/Config.js` para poner la IP de tu backend y los endpoints según tu red local. Ejemplo:
     ```js
     export const API_BASE_URL = 'http://<TU_IP_LOCAL>:5001';
     export const TRANSCRIBE_URL = 'http://<TU_IP_LOCAL>:5000/transcribe';
     export const MICROPHONE_URL = 'http://<TU_IP_LOCAL>:8080/audio.wav';
     ```
   - Si usas otros endpoints, también puedes editarlos en `constant/api.js` y `services/userService.js`.
   - Cambia también las URLs en los hooks si es necesario (por ejemplo, en `useSSETranscription.js`).

3. **Configura fuentes personalizadas:**
   - Las fuentes están en `assets/fonts/` y se cargan con el hook `useCustomFonts`.

4. **Variables de entorno:**
   - No es obligatorio un archivo `.env` para el frontend, toda la configuración de endpoints se realiza en `constant/Config.js`.

## Scripts útiles

- `npm start`    : Inicia el servidor de desarrollo Expo.
- `npm run android` : Ejecuta la app en un emulador/dispositivo Android.
- `npm run ios`     : Ejecuta la app en un emulador/dispositivo iOS.
- `npm run web`     : Ejecuta la app en modo web.

## Notas importantes

- **IPs locales:** La app está pensada para funcionar en red local, asegúrate de que tu dispositivo móvil esté en la misma red que los servicios backend.
- **Permisos:** La app solicita permisos de ubicación y acceso a la cámara/micrófono.
- **Personalización:** Puedes modificar los colores y tipografías en `constant/Colors.js` y `constant/Typography.js`.
- **Desarrollo:** El contexto de usuario y cámara se maneja con React Context y hooks personalizados.

---

Desarrollado por el equipo Kuntur. Para dudas o soporte, contacta al equipo de desarrollo.
