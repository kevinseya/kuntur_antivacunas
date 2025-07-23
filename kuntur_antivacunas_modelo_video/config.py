import os
from dotenv import load_dotenv

load_dotenv()  # Carga variables desde .env

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME')
COLLECTION_NAME = os.getenv('COLLECTION_NAME')
MODEL_PATH = os.getenv('MODEL_PATH')
CAM_URL = os.getenv('CAM_URL')