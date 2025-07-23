import os
import io
import requests
import time
import subprocess
import tempfile
import threading
from pathlib import Path

# Configuración
TRANSCRIBE_URL = "http://192.168.1.34:5000/transcribe"  # URL del endpoint de transcripción (tu backend principal)
IP_MICROPHONE = "http://192.168.1.51:8080/audio.wav"  # IP del micrófono

def capture_audio_fragment(ip_camara, duration=5):
    """Captura un fragmento de audio de duración específica desde el micrófono IP"""
    try:
        # Crear un archivo temporal para el audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Comando ffmpeg para capturar audio durante X segundos
        command = [
            'ffmpeg', 
            '-i', ip_camara,
            '-vn',  # Sin video
            '-acodec', 'pcm_s16le',  # Codec de audio
            '-ar', '44100',  # Sample rate
            '-ac', '2',  # Canales estéreo
            '-t', str(duration),  # Duración en segundos
            '-y',  # Sobrescribir archivo si existe
            temp_path
        ]
        
        # Ejecutar ffmpeg
        process = subprocess.run(command, capture_output=True, text=True)
        
        if process.returncode == 0:
            # Leer el archivo de audio capturado
            with open(temp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Limpiar archivo temporal
            os.unlink(temp_path)
            
            return audio_data
        else:
            print(f"Error en ffmpeg: {process.stderr}")
            return None
            
    except Exception as e:
        print(f"Error capturando audio: {e}")
        return None

def send_to_transcribe(audio_data):
    """Envía el fragmento de audio al endpoint de transcripción"""
    try:
        # Crear el archivo en memoria para enviar
        files = {
            "audio": ("audio.wav", io.BytesIO(audio_data), "audio/wav")
        }
        
        # Enviar POST request
        response = requests.post(TRANSCRIBE_URL, files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            transcribed_text = result.get("output", "")
            
            if transcribed_text.strip():  # Solo mostrar si hay texto
                print(f"🎤 Transcripción: {transcribed_text}")
            else:
                print("🔇 Audio sin contenido de voz")
                
        else:
            print(f"❌ Error al transcribir: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    except Exception as e:
        print(f"❌ Error enviando audio: {e}")

def continuous_audio_capture():
    """Función principal que captura audio continuamente"""
    print(f"🎙️  Iniciando captura de audio desde: {IP_MICROPHONE}")
    print(f"📡 Enviando transcripciones a: {TRANSCRIBE_URL}")
    print("⏱️  Capturando fragmentos de 5 segundos...")
    print("🛑 Presiona Ctrl+C para detener")
    print("-" * 50)
    
    fragment_count = 0
    
    while True:
        try:
            fragment_count += 1
            print(f"📹 Capturando fragmento #{fragment_count}...")
            
            # Capturar fragmento de audio
            audio_data = capture_audio_fragment(IP_MICROPHONE, duration=5)
            
            if audio_data:
                print(f"✅ Audio capturado: {len(audio_data)} bytes")
                
                # Enviar a transcripción
                send_to_transcribe(audio_data)
            else:
                print("❌ No se pudo capturar audio")
            
            print("-" * 30)
            
            # Pequeña pausa antes del siguiente fragmento
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo captura de audio...")
            break
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            time.sleep(5)  # Esperar antes de reintentar

def test_connection():
    """Prueba la conexión al micrófono IP y al endpoint de transcripción"""
    print("🔍 Probando conexiones...")
    
    # Probar conexión al micrófono IP
    try:
        response = requests.head(IP_MICROPHONE, timeout=5)
        print(f"✅ Micrófono IP accesible: {IP_MICROPHONE}")
    except:
        print(f"❌ No se puede acceder al micrófono IP: {IP_MICROPHONE}")
        return False
    
    # Probar conexión al endpoint de transcripción
    try:
        response = requests.get(TRANSCRIBE_URL.replace('/transcribe', '/'), timeout=5)
        print(f"✅ Servidor de transcripción accesible: {TRANSCRIBE_URL}")
    except:
        print(f"❌ No se puede acceder al servidor de transcripción: {TRANSCRIBE_URL}")
        return False
    
    return True

if __name__ == '__main__':
    print("🎵 Cliente de Captura de Audio IP")
    print("=" * 50)
    
    # Verificar que ffmpeg esté instalado
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("✅ FFmpeg encontrado")
    except:
        print("❌ FFmpeg no está instalado o no está en PATH")
        print("   Instala FFmpeg desde: https://ffmpeg.org/")
        exit(1)
    
    # Probar conexiones
    if not test_connection():
        print("\n❌ No se pueden establecer las conexiones necesarias")
        exit(1)
    
    print("\n🚀 Iniciando captura continua...")
    
    # Iniciar captura continua
    try:
        continuous_audio_capture()
    except KeyboardInterrupt:
        print("\n👋 ¡Programa terminado!")
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")