# Kuntur Antivacunas - Monorepo

Este repositorio contiene el sistema completo para el servicio antivacunas de la aplicación móvil **Kuntur**. El monorepo está organizado en cuatro proyectos principales:

## Estructura del repositorio

- **kuntur_antivacunas_captura_audio/**
  - Microservicio en Python (FastAPI/Flask) para la captura y transcripción de audio en tiempo real.
  - Incluye rutas para captura, servicios de transcripción y servidor de audio.
  - Usa entornos virtuales y dependencias en `requirements.txt`.

- **kuntur_antivacunas_front_react_native/**
  - Aplicación móvil desarrollada en React Native.
  - Incluye componentes para streaming de audio/video, registro de usuarios, mapas y hooks personalizados.
  - Configuración de Expo y Metro, assets gráficos y fuentes.

- **kuntur_antivacunas_modelo_audio/**
  - Microservicio en Python para análisis, autenticación y notificación de amenazas a partir de audio.
  - Incluye integración con Firebase, análisis con IA (Gemini), rutas para alertas y transcripción, y plantillas HTML.
  - Usa archivos estáticos y plantillas para la interfaz web.

- **kuntur_antivacunas_modelo_video/**
  - Microservicio en Python para análisis de video y detección de amenazas usando modelos YOLO.
  - Incluye scripts de prueba, carga a la nube, y utilidades para manejo de datos y modelos.
  - Contiene modelos pre-entrenados y carpetas para datos y resultados.

## Instalación y uso

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repo>
   ```
2. **Configura los entornos virtuales:**
   - Para cada microservicio Python, activa el entorno virtual y ejecuta:
     ```bash
     pip install -r requirements.txt
     ```
3. **Instala dependencias de React Native:**
   ```bash
   cd kuntur_antivacunas_front_react_native
   npm install
   ```
4. **Configura variables de entorno y credenciales** según los archivos `.env` y `firebase-config.json` (no incluidos por seguridad).

## Descripción de carpetas principales

- **routes/**: Rutas de API para cada microservicio.
- **services/**: Lógica de negocio y servicios auxiliares.
- **static/** y **templates/**: Recursos estáticos y plantillas web (modelo_audio).
- **assets/**: Imágenes, fuentes y recursos gráficos (front).
- **components/**: Componentes reutilizables de React Native.
- **hooks/**: Hooks personalizados para lógica de la app móvil.
- **modelos/** y **data/**: Modelos y datos para análisis de video.

## Notas
- Los archivos de entorno, credenciales y modelos grandes están excluidos por `.gitignore`.
- Cada microservicio puede ejecutarse y desarrollarse de forma independiente.
- Para producción, asegúrate de configurar correctamente las variables de entorno y credenciales.

---

**Kuntur Antivacunas** es un sistema integral para la detección y alerta de amenazas antivacunas mediante audio y video, integrando IA, notificaciones y una app móvil para usuarios y operadores.
