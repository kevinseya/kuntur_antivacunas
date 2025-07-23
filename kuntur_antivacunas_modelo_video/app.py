from flask import Flask
from dotenv import load_dotenv
import os

from config import *
from models import init_models, init_mongo
from detection import detection_loop
from routes import create_routes

# Cargar variables .env
load_dotenv()

app = Flask(__name__)

# Variables compartidas
detection_flag = {'active': False}
descripciones_por_track = {}
carpetas_frames = "data/frames"
os.makedirs(carpetas_frames, exist_ok=True)

# Inicializar modelos y MongoDB
processor, blip_model, model, device = init_models()
mongo_client, collection = init_mongo()

# Guardar en app.config para acceso en routes y detection
app.config.update(
    processor=processor,
    blip_model=blip_model,
    model=model,
    device=device,
    carpetas_frames=carpetas_frames,
    collection=collection
)

# Crear endpoints
create_routes(app, detection_flag, descripciones_por_track, collection)

if __name__ == '__main__':
    try:
        print("🚀 Servidor iniciado en http://0.0.0.0:5002")
        app.run(host='0.0.0.0', port=5002, debug=False)
    except KeyboardInterrupt:
        print("\n🔴 Cerrando servidor...")
        if detection_flag['active']:
            detection_flag['active'] = False
        if 'mongo_client' in locals():
            mongo_client.close()