# routes/alerta_routes.py
import os
import uuid
from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from services.gemini_analyzer import procesar_evento_con_ia
from services.video_uploader import grabar_y_subir_video
from services.db import coleccion_alertas
from services.global_state import event_queue, eventos_detectados
from services.notificador_upc import notificar_a_upc

alerta_bp = Blueprint("alerta", __name__)

@alerta_bp.route("/alerta_manual", methods=["POST"])
def alerta_manual():
    data = request.get_json() or {}

    evento_id = str(uuid.uuid4())
    texto_simulado = "Se reporta una amenaza directa en el lugar. El usuario ha activado una alerta manualmente."

    evento = {
        "id": evento_id,
        "texto": texto_simulado,
        "hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "manual": True,
        "nombre_local": data.get("nombre_local"),
        "ubicacion": data.get("ubicacion"),
        "ip_camara": data.get("ip_camara"),
        "latitud": data.get("latitud"),
        "longitud": data.get("longitud")
    }

    try:
        evento_enriquecido = procesar_evento_con_ia(evento)
    except Exception as e:
        print(f"❌ Error IA manual: {e}")
        evento_enriquecido = evento
        evento_enriquecido["analisis_ia"] = "No disponible"

    try:
        link_video = grabar_y_subir_video(
            evento["ip_camara"],
            bucket_name="kuntur-extorsiones",
            key_id=os.getenv("B2_KEY_ID"),
            app_key=os.getenv("B2_APP_KEY")
        )
        evento_enriquecido["link_evidencia"] = link_video
    except Exception as e:
        print(f"⚠️ Error subiendo video: {e}")
        evento_enriquecido["link_evidencia"] = "No disponible"

    eventos_detectados.append(evento_enriquecido)

    event_queue.put({
        "mensaje": "🚨 Alerta manual activada",
        "evento_id": evento_id,
        "texto": evento_enriquecido["texto"],
        "link_evidencia": evento_enriquecido.get("link_evidencia", ""),
        "ip_camera": evento_enriquecido.get("ip_camara"),
        "analisis": evento_enriquecido.get("analisis_ia", "Sin análisis"),
        "hora": evento_enriquecido["hora"],
        "nombre_local": evento_enriquecido.get("nombre_local"),
        "ubicacion": evento_enriquecido.get("ubicacion"),
        "latitud": evento_enriquecido.get("latitud"),
        "longitud": evento_enriquecido.get("longitud")
    })

    riesgo = "MEDIO"
    for nivel in ["CRÍTICO", "ALTO", "MEDIO", "BAJO"]:
        if nivel.lower() in evento_enriquecido["analisis_ia"].lower():
            riesgo = nivel
            break

    # Tolerante con usuario_id: puede no venir
    usuario_id = data.get("usuario_id")
    mongo_doc = {
        "nombre_local": evento_enriquecido.get("nombre_local"),
        "ubicacion": evento_enriquecido.get("ubicacion"),
        "ip_camara": evento_enriquecido.get("ip_camara"),
        "latitud": evento_enriquecido.get("latitud"),
        "longitud": evento_enriquecido.get("longitud"),
        "texto_detectado": evento_enriquecido["texto"],
        "descripcion_alerta": evento_enriquecido["analisis_ia"],
        "nivel_riesgo": riesgo,
        "fecha": datetime.now(),
        "link_evidencia": evento_enriquecido.get("link_evidencia", "No disponible")
    }
    if usuario_id:
        try:
            mongo_doc["id_usuario"] = ObjectId(usuario_id)
        except Exception:
            mongo_doc["id_usuario"] = usuario_id  # por si no es un ObjectId válido

    coleccion_alertas.insert_one(mongo_doc)

    notificar_a_upc(
        descripcion=evento_enriquecido["analisis_ia"],
        ubicacion=evento_enriquecido["ubicacion"],
        ip_camara=evento_enriquecido["ip_camara"],
        url_evidencia=evento_enriquecido.get("link_evidencia")
    )

    return {"status": "ok", "evento_id": evento_id}
