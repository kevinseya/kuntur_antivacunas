# Proyecto de Captura y Transcripción de Audio

Este proyecto proporciona una solución para capturar audio de una cámara IP y enviarlo a un servidor de transcripción. La transcripción es enviada en tiempo real a través de WebSocket. Este sistema se puede utilizar con aplicaciones como React Native que se conectan al servidor para recibir las transcripciones.

## Endpoints disponibles

### 1. **`POST /audio/start-capture`**
   - **Descripción**: Inicia la captura de audio desde la cámara IP configurada.
   - **Datos de entrada** (JSON):
     ```json
     {
       "latitud": 19.4326,
       "longitud": -99.1332,
       "nombre_local": "Local X",
       "ip_camara": "http://192.168.100.18:8080/audio.wav"
     }
     ```
     - **latitud**: Latitud del lugar.
     - **longitud**: Longitud del lugar.
     - **nombre_local**: Nombre del local o ubicación.
     - **ip_camara**: URL de la cámara IP que proporciona el audio.

   - **Respuesta**:
     ```json
     {
       "message": "Captura de audio iniciada."
     }
     ```

   - **Función**: Inicia la captura de audio desde la cámara IP y la envía al servicio de transcripción cada 5 segundos.

### 2. **`POST /audio/stop-capture`**
   - **Descripción**: Detiene la captura de audio.
   - **Respuesta**:
     ```json
     {
       "message": "Captura de audio detenida."
     }
     ```

   - **Función**: Detiene el proceso de captura de audio y transcripción.

---

## Configuración del WebSocket para transcripciones

El servidor emite las transcripciones de audio a través de **WebSocket**. Para recibir las transcripciones en tiempo real en tu aplicación React Native, sigue estos pasos:

### **En el servidor (Flask)**:

1. **Instala `flask-socketio`**:
   ```bash
   pip install flask-socketio
    ```

2. **Asegúrate de que tu servidor esté configurado para emitir transcripciones**:

El servidor emite las transcripciones a través de WebSocket cuando una transcripción es procesada. Este es el código básico para emitir transcripciones a través de socketio.emit:

```bash
   socketio.emit('new_transcription', {'text': transcribed_text})
```

### En React Native:
No olvides configurar el WebSocket en tu aplicación:

### Instalación
1. **FFmpeg**:
Debes tener FFmpeg instalado en tu máquina. Puedes instalarlo usando winget:

```bash
winget install ffmpeg
```
2. **IP Webcam (para móviles):**:
En tu teléfono móvil, instala la aplicación IP Webcam desde Google Play Store.

Una vez instalada, abre la aplicación y empieza la transmisión de la cámara, copiando la URL de transmisión proporcionada.

```bash
- /video //Para video
- /audio.wav //Para audio
```

3. **Configuración del archivo `.env`**:
```bash
# Configuración del micrófono y servidor de transcripción
MICROPHONE_URL="http://192.168.100.18:8080/audio.wav"
TRANSCRIBE_URL="http://localhost:5000/transcribe"

# Parámetros para la captura de audio
CAPTURE_DURATION=5   

# Puerto para el servidor
PORT=5001

```
- `MICROPHONE_URL:` La URL de tu cámara IP (obtenida de la app IP Webcam).

- `TRANSCRIBE_URL:` La URL del servidor de transcripción. En este caso, el servidor de Flask está en http://localhost:5000/transcribe.

- `CAPTURE_DURATION:` Duración de cada fragmento de audio capturado en segundos.

- `PORT:` Puerto donde el servidor Flask estará escuchando.

### Ejecución
1. **Instalar las dependencias**:
```bash
pip install -r requirements.txt
```
2. **Ejecutar el servidor**:
```bash
python app.py
```
3. **Inicia la captura de audio desde Postman o tu aplicacion Reac-Native**

- Iniciar la captura (POST a `http://localhost:5000/audio/start-capture`):

```bash
{
  "latitud": 19.4326,
  "longitud": -99.1332,
  "nombre_local": "Local X",
  "ip_camara": "http://192.168.100.18:8080/audio.wav"
}
```
- Detener la captura (POST a `http://localhost:5000/audio/stop-capture`):

### Conclusión

Con este proyecto, puedes capturar audio en tiempo real desde una cámara IP y transcribirlo utilizando un servidor Flask. Las transcripciones se envían en tiempo real a tu aplicación React Native a través de WebSocket, lo que permite una experiencia fluida y dinámica.