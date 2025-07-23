# services/transcribe_service.py

import io
import requests
from dotenv import load_dotenv
import os

# Cargar las variables de configuración desde el archivo .env
load_dotenv()
TRANSCRIBE_URL = os.getenv('TRANSCRIBE_URL')

def send_to_transcribe(audio_data):
    """Envía el fragmento de audio al endpoint de transcripción y emite la transcripción por WebSocket"""
    try:
        # Preparar el archivo en memoria para el POST
        files = {
            "audio": ("audio.wav", io.BytesIO(audio_data), "audio/wav")
        }

        print(f"📤 Enviando {len(audio_data)} bytes a {TRANSCRIBE_URL}")

        # Llamada al endpoint de transcripción
        response = requests.post(TRANSCRIBE_URL, files=files, timeout=30)

        if response.status_code == 200:
            result = response.json()
            transcribed_text = result.get("output", "").strip()

            if transcribed_text:
                print(f"🎤 Transcripción recibida: {transcribed_text}")
                
                # SOLUCIÓN: Importar la función emit_transcription en lugar de socketio
                try:
                    from app import emit_transcription
                    emit_transcription(transcribed_text)
                    print("✅ Transcripción emitida via WebSocket")
                except ImportError as e:
                    print(f"❌ Error importando emit_transcription: {e}")
                except Exception as e:
                    print(f"❌ Error emitiendo transcripción: {e}")
            else:
                print("🔇 Audio sin contenido de voz")

        else:
            print(f"❌ Error al transcribir: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión al transcribir: {e}")
    except Exception as e:
        print(f"❌ Error enviando audio: {e}")