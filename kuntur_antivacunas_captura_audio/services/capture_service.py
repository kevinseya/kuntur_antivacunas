# services/capture_service.py

import os
import time
import subprocess
import tempfile
import threading
from typing import Optional
from dotenv import load_dotenv
from .transcribe_service import send_to_transcribe

# 1) Carga de configuración desde .env
load_dotenv()
IP_CAMARA     = os.getenv('MICROPHONE_URL')             # Ej: http://192.168.1.51:8080/audio.wav
FFMPEG_PATH   = os.getenv('FFMPEG_PATH', 'ffmpeg')       # Ruta o comando ffmpeg
CAPTURE_SEC   = int(os.getenv('CAPTURE_DURATION', '5'))  # Segundos por fragmento

# 2) Variables globales de estado
latitud        = None
longitud       = None
nombre_local   = None
capture_active = False
capture_thread = None

def capture_audio_fragment(duration: int = CAPTURE_SEC) -> Optional[bytes]:
    """Captura un fragmento de audio desde la IP_CAMARA durante `duration` segundos."""
    if not IP_CAMARA:
        print("❌ MICROPHONE_URL no configurada en .env")
        return None

    # Verificar ffmpeg
    try:
        subprocess.run([FFMPEG_PATH, '-version'], capture_output=True, check=True)
    except subprocess.CalledProcessError:
        print(f"❌ FFmpeg no encontrado en `{FFMPEG_PATH}`")
        return None

    # Captura a fichero temporal
    try:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
            temp_path = tf.name

        cmd = [
            FFMPEG_PATH,
            '-i', IP_CAMARA,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            '-t', str(duration),
            '-y',
            temp_path
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print(f"❌ Error ffmpeg: {proc.stderr.strip()}")
            return None

        with open(temp_path, 'rb') as f:
            data = f.read()
        os.unlink(temp_path)
        return data

    except Exception as e:
        print(f"❌ Excepción capturando audio: {e}")
        return None

def continuous_audio_capture():
    """Bucle que, mientras capture_active sea True, graba y envía fragmentos."""
    global capture_active
    counter = 0
    while capture_active:
        counter += 1
        print(f"📹 Capturando fragmento #{counter}...")
        audio = capture_audio_fragment()
        if audio:
            print(f"✅ {len(audio)} bytes capturados. Enviando a transcribir…")
            send_to_transcribe(audio)
        else:
            print("❌ No se obtuvo audio.")
        print("-" * 30)
        time.sleep(1)

def start_capture_thread():
    """Inicia el hilo de captura si no está ya activo."""
    global capture_active, capture_thread
    if capture_active:
        print("⚠️ Captura ya activa.")
        return
    capture_active = True
    capture_thread = threading.Thread(
        target=continuous_audio_capture,
        daemon=True
    )
    capture_thread.start()
    print("🚀 Hilo de captura arrancado.")

def stop_capture():
    """Marca capture_active=False para que el hilo termine tras la próxima iteración."""
    global capture_active
    if not capture_active:
        print("⚠️ Captura ya estaba detenida.")
        return
    capture_active = False
    print("🛑 Señal de parada enviada al hilo de captura.")

def store_local_info(lat, lon, local_name, ip_camara=None):
    """
    Guarda la información del local (latitud, longitud, nombre)
    y, opcionalmente, actualiza la URL de la cámara/audio.
    """
    global latitud, longitud, nombre_local, IP_CAMARA
    latitud      = lat
    longitud     = lon
    nombre_local = local_name

    if ip_camara:
        # Si no viene con "/audio.wav", lo añadimos automáticamente
        base = ip_camara.rstrip('/')
        IP_CAMARA = base if base.endswith('/audio.wav') else f"{base}/audio.wav"

    print(f"📍 Local: {nombre_local} (Lat:{latitud}, Lon:{longitud}), Cámara: {IP_CAMARA}")

