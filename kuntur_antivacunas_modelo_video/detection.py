import cv2
import threading
from PIL import Image
from datetime import datetime
from collections import deque
from googletrans import Translator
from refine_llm import find_previous_alerts, refine_description_with_gemini
import os
from collections import deque
from uploader import upload_video_to_cloudinary, upload_frame_to_cloudinary
from utils import save_buffer_to_video
import subprocess
import uuid



from utils import encode_frame_to_base64, save_alert_to_mongo

# Traductor fuera del bucle para evitar recarga constante
translator = Translator()

def translate_to_spanish(text):
    try:
        translated = translator.translate(text, src='en', dest='es')
        return translated.text
    except Exception as e:
        print(f"❌ Error al traducir: {e}")
        return text
os.makedirs("data/videos", exist_ok=True)

def detection_loop(
    model, processor, blip_model, device,
    collection, carpetas_frames,
    detection_flag,
    descripciones_por_track,
    latitud, longitud, nombre_local, ip_camara
):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print(f"❌ Error al abrir cámara o stream: {os.getenv('CAM_URL')}")
        return

    print("🟢 Sistema de detección iniciado")
    frame_count = 0
    frame_buffer = deque(maxlen=300)  # Últimos 2s aprox si 30fps

    while detection_flag['active']:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error al capturar frame")
            break

        frame_count += 1
        frame_buffer.append(frame.copy())  # Guardar copia
        if frame_count % 4 != 0:
            continue  # Solo procesa cada 4 frames

        results = model.track(frame, persist=True, conf=0.6, imgsz=640, verbose=False, tracker="bytetrack.yaml")[0]

        if results is not None and results.boxes is not None:
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = box.conf[0].item()
                track_id = int(box.id[0]) if box.id is not None else None

                if cls_id == 0 and track_id is not None and conf >= 0.8:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    arma_crop = frame[y1:y2, x1:x2]
                    if arma_crop.size == 0:
                        continue

                    arma_image = Image.fromarray(cv2.cvtColor(arma_crop, cv2.COLOR_BGR2RGB))

                    # Descripción con BLIP
                    inputs = processor(arma_image, return_tensors="pt").to(device)
                    out = blip_model.generate(**inputs, max_new_tokens=20)
                    descripcion_arma = processor.decode(out[0], skip_special_tokens=True)

                    # Traducción al español
                    descripcion_arma_es = translate_to_spanish(descripcion_arma)

                    # Comparar con descripciones anteriores
                    descripcion_anterior = descripciones_por_track.get(track_id, "")
                    if descripcion_arma != descripcion_anterior:
                        texto = f"ARMA ID:{track_id} {conf*100:.1f}%"
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, texto, (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

                        now = datetime.now().strftime("%Y%m%d_%H%M%S")
                        ruta_frame = os.path.join(carpetas_frames, f"alerta_{track_id}_{now}.jpg")
                        cv2.imwrite(ruta_frame, frame)

                        frame_base64 = encode_frame_to_base64(frame)
                        alert_id = str(uuid.uuid4())

                        # Guardar en MongoDB
                        save_alert_to_mongo(
                            alert_id=alert_id,
                            collection=collection,
                            track_id=track_id,
                            confidence="0",
                            descripcion_arma=descripcion_arma_es,
                            latitud=latitud,
                            longitud=longitud,
                            nombre_local=nombre_local,
                            ip_camara=ip_camara,
                        )

                        # Buscar alertas anteriores y refinar
                        previous_alerts = find_previous_alerts(collection, track_id)
                        refine_description_with_gemini(
                            descripcion_arma_es,
                            conf,
                            previous_alerts,
                            ruta_frame
                        )
                        respuesta = refine_description_with_gemini(
                            descripcion_arma_es,
                            track_id,
                            previous_alerts,
                            ruta_frame
                        )

                        if respuesta:
                            confianza_gemini = respuesta.get("confidence_level", 0)
                            gravedad = respuesta.get("threat_severity", "desconocida")
                            print(f"🎯 Confianza Gemini: {confianza_gemini} | Gravedad: {gravedad}")

                            if confianza_gemini >= 10:
                                video_path = f"data/videos/alerta_{track_id}_{now}.mp4"
                                print(f"🎬 Guardando video localmente en: {video_path}...")  # <== Añade este
                                save_buffer_to_video(list(frame_buffer), video_path)
                                # Ruta temporal para el video codificado
                                temp_video_path = f"data/videos/alerta_{track_id}_{now}_encoded.mp4"

                                # Comando ffmpeg para codificar el video a un formato compatible (H.264 + AAC)
                                
                                command = [
                                        "ffmpeg",
                                        "-i", video_path,  # Video original
                                        "-c:v", "libx264",  # Códec H.264 para video
                                        "-crf", "23",  # Calidad de la codificación (23 es un buen valor)
                                        "-preset", "fast",  # Velocidad de codificación
                                        "-c:a", "aac",  # Códec AAC para audio
                                        "-strict", "experimental",  # Para usar códec AAC experimental si es necesario
                                        temp_video_path  # Guardamos el video codificado en esta ruta
                                ]
                                    
                                subprocess.run(command, check=True)  # Ejecutamos el comando ffmpeg
                                    
                                print(f"Video codificado exitosamente y guardado como {temp_video_path}")

                                # Eliminamos el archivo de video original
                                os.remove(video_path)
                                print(f"Video original eliminado: {video_path}")

                                # Renombramos el video codificado para que tenga el nombre del original
                                os.rename(temp_video_path, video_path)
                                print(f"Video renombrado a {video_path}")

                                # Subimos el video codificado a Cloudinary
                                print(f"📤 Subiendo video a Cloudinary desde: {video_path}...")
                                video_url = upload_video_to_cloudinary(video_path, folder="alertas_videos")
                                os.remove(video_path)
                                frame_url = upload_frame_to_cloudinary(ruta_frame, folder="alertas_frames") 
                                os.remove(ruta_frame)
                                if video_url:
                                    print(f"🎥 Video subido: {video_url}")

                                    # Opcional: guardar link del video en Mongo
                                    collection.update_one(
                                        {"alert_id": alert_id}, 
                                        {"$set": {
                                            "video_url": video_url,
                                            "refined_description": respuesta.get("refined_description"),
                                            "confidence": respuesta.get("confidence_level") ,
                                            "frame_url": frame_url
                                        }},
                                        upsert=False
                                    )
                        

                        print(f"📸 Frame guardado: {ruta_frame}")
                        print(f"🧠 Descripción EN: {descripcion_arma}")
                        print(f"🧠 Descripción ES: {descripcion_arma_es}")
                        print(f"🚨 ALERTA - Confianza: {conf*100:.1f}%")

                        descripciones_por_track[track_id] = descripcion_arma

    cap.release()
    print("🔴 Sistema de detección detenido")
