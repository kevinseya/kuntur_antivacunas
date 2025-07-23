import requests
from datetime import datetime, timedelta
import google.generativeai as genai
from PIL import Image
from pymongo import MongoClient
import os
import json
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la API Key de Gemini desde las variables de entorno
gemini_api_key = os.getenv("GEMINI_API_KEY")

# Configurar Gemini
genai.configure(api_key=gemini_api_key)

# Conexión con MongoDB
def connect_mongo(mongo_url, db_name, collection_name):
    client = MongoClient(mongo_url)
    db = client[db_name]
    collection = db[collection_name]
    return collection

# Buscar alertas previas de un mismo track_id
def find_previous_alerts(collection, track_id, time_window_seconds=30):
    current_time = datetime.now()
    time_limit = current_time - timedelta(seconds=time_window_seconds)

    alerts = collection.find({
        "track_id": track_id,
        "timestamp": {"$gte": time_limit}
    }).sort("timestamp", 1)

    return list(alerts)

def refine_description_with_gemini(description, track_id, previous_alerts, image_path):
    previous_descriptions = "\n".join([alert['descripcion_arma'] for alert in previous_alerts])

    # Cargar la imagen como objeto PIL
    image = Image.open(image_path)

    # Crear el prompt
    prompt = f"""
    Descripción actual de la amenaza: {description}.
    Descripción de amenazas previas: {previous_descriptions}.

    Basado en la descripción actual y las amenazas previas, proporcione un análisis detallado sobre si la situación ha escalado y requiere intervención inmediata.
    Califique la gravedad de la amenaza: grave, leve o crítico.
    Evalúe si hay intención de usar el arma y el nivel de confianza de que la amenaza es real (0-100).
    Devuelva la respuesta en formato JSON con los campos:
    - threat_severity
    - confidence_level
    - refined_description
    - image_path
    - timestamp
    """

    model = genai.GenerativeModel("gemini-1.5-flash")

    try:
        response = model.generate_content([prompt, image])
        response_text = response.text.strip()

        # --- Limpieza específica para el caso ---
        # Quitar ```json y ``` si existen (problema común en la respuesta)
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        print("Respuesta limpia de Gemini:", response_text)

        try:
            json_response = json.loads(response_text.replace("'", '"'))
            json_response["image_path"] = image_path
            json_response["timestamp"] = datetime.now().isoformat()
            print("✅ JSON parseado correctamente:", json.dumps(json_response, indent=4))
            return json_response
        except json.JSONDecodeError:
            print("⚠️ La respuesta no está en formato JSON válido.")
            return None

    except Exception as e:
        print("❌ Error en llamada a Gemini:", e)
        return None
