import torch
from pymongo import MongoClient
from transformers import BlipProcessor, BlipForConditionalGeneration
import ultralytics
import threading

from config import MONGO_URL, DB_NAME, COLLECTION_NAME

# Función para inicializar modelos y conexión a MongoDB
def init_models():
    from transformers import BlipProcessor, BlipForConditionalGeneration
    from ultralytics import YOLO
    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print("🔧 Cargando modelos...")
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
    model = YOLO('modelos/weapon_yolov8n.pt') 
    return processor, blip_model, model, device

def init_mongo():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    return client, collection