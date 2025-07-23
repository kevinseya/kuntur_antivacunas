# Kuntur Antivacunas - Modelo Video

Microservicio en Python para la detección de amenazas mediante análisis de video, usando modelos de IA (YOLO, BLIP, Gemini) y almacenamiento en MongoDB. Permite la detección en tiempo real, almacenamiento de alertas, subida de videos/frames a Cloudinary y refinamiento de descripciones con LLM.

---

## Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Estructura de Carpetas y Archivos](#estructura-de-carpetas-y-archivos)
- [Requisitos](#requisitos)
- [Configuración Inicial](#configuración-inicial)
- [Uso](#uso)
- [Endpoints Principales](#endpoints-principales)
- [Notas y Consejos](#notas-y-consejos)

---

## Descripción General

Este servicio procesa streams de video para detectar armas u objetos peligrosos, genera alertas, sube evidencia a la nube y refina descripciones usando IA generativa. Se integra con otros servicios de Kuntur y expone endpoints REST vía Flask.

---

## Estructura de Carpetas y Archivos

- `app.py`                : Punto de entrada principal (Flask).
- `config.py`             : Configuración y carga de variables de entorno.
- `detection.py`          : Lógica de detección, procesamiento de frames y generación de alertas.
- `models.py`             : Inicialización de modelos YOLO, BLIP y conexión a MongoDB.
- `refine_llm.py`         : Refinamiento de descripciones con Gemini y búsqueda de alertas previas.
- `routes.py`             : Definición de endpoints Flask para iniciar/detener detección y consultar estado.
- `uploader.py`           : Subida de videos y frames a Cloudinary.
- `utils.py`              : Utilidades para codificación, guardado y registro de alertas.
- `test_image_cloudinary.py`, `test_video_cloudinary.py`: Scripts de prueba para subida a Cloudinary.
- `requirements.txt`      : Dependencias del proyecto.
- `informacion.txt`       : Notas rápidas (ej. comandos para MongoDB y ffmpeg).
- `data/frames/`          : Carpeta para frames capturados.
- `data/videos/`          : Carpeta para videos generados.
- `modelos/weapon_yolov8n.pt` : Modelo YOLOv8 para detección de armas.
- `yolo11n.pt`            : Otro modelo YOLO (si aplica).
- `env/`                  : Entorno virtual Python (ignorado por git).
- `__pycache__/`          : Caché de Python (ignorado por git).

---

## Requisitos
- Python 3.10+
- MongoDB en ejecución
- Cuenta y credenciales de Cloudinary
- API Key de Gemini (Google Generative AI)
- ffmpeg instalado (para procesamiento de video)

Instala dependencias:
```bash
pip install -r requirements.txt
```

---

## Configuración Inicial
1. Crea un archivo `.env` con las siguientes variables:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=kuntur
   COLLECTION_NAME=alertas
   MODEL_PATH=modelos/weapon_yolov8n.pt
   CAM_URL=rtsp://... # o la url de tu cámara
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   GEMINI_API_KEY=...
   ```
2. Asegúrate de que MongoDB esté corriendo:
   ```bash
   net start MongoDB
   ```
3. Instala ffmpeg:
   ```bash
   winget install ffmpeg
   ```

---

## Uso

1. Ejecuta el servidor Flask:
   ```bash
   python app.py
   ```
2. El servicio quedará disponible en `http://0.0.0.0:5002`.

---

## Endpoints Principales

- `POST /start_detection`  : Inicia la detección (requiere datos de localización y cámara en el body).
- `POST /stop_detection`   : Detiene la detección.
- `GET  /status`           : Consulta el estado del servicio.

---

## Notas y Consejos
- Los videos y frames de alertas se suben automáticamente a Cloudinary.
- Las descripciones de alertas se refinan usando Gemini y se almacenan en MongoDB.
- Puedes probar la subida a Cloudinary con los scripts de test incluidos.
- El modelo YOLO debe estar en la ruta indicada en `.env`.
- El servicio está pensado para ejecutarse en servidores Linux o Windows.
- Los archivos grandes y credenciales están excluidos por `.gitignore`.

---

Desarrollado por el equipo Kuntur. Para dudas o soporte, contacta al equipo de desarrollo.
