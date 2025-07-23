import cv2
import base64
from datetime import datetime
from PIL import Image



def encode_frame_to_base64(frame):
    try:
        _, buffer = cv2.imencode('.jpg', frame)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"❌ Error al codificar frame: {e}")
        return None

def save_alert_to_mongo(alert_id, collection, track_id, confidence, descripcion_arma, latitud, longitud, nombre_local, ip_camara, video_url=None, frame_url=None):
    from datetime import datetime

    try:
        # Creando el diccionario de los datos de alerta
        alert_data = {
            "alert_id": alert_id, 
            "timestamp": datetime.now(),
            "track_id": track_id,
            "confidence": confidence,
            "descripcion_arma": descripcion_arma,
            "latitud": latitud,
            "longitud": longitud,
            "nombre_local": nombre_local,
            "ip_camara": ip_camara,
            "processed": False
        }

        # Agregar video_url si existe
        if video_url:
            alert_data["video_url"] = video_url
        
        # Agregar frame_url si existe
        if frame_url:
            alert_data["frame_url"] = frame_url

        # Insertar una sola vez el documento en MongoDB
        result = collection.insert_one(alert_data)
        
        # Imprimir el mensaje de éxito
        print(f"💾 Alerta guardada en MongoDB con ID: {result.inserted_id}")
        return result.inserted_id

    except Exception as e:
        # Imprimir el error si ocurre
        print(f"❌ Error al guardar en MongoDB: {e}")
        return None

def save_buffer_to_video(frames, output_path, fps=30):
    if not frames:
        return

    height, width, _ = frames[0].shape
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for frame in frames:
        out.write(frame)
    out.release()
