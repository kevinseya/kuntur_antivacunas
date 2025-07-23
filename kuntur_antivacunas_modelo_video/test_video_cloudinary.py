import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# Cargar las variables de entorno
load_dotenv()

# Configuración de Cloudinary con las credenciales
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Ruta del video a subir
video_path = r"C:\Users\Mateo\Desktop\final\kuntur_antivacunas_video\data\videos\alerta_6_20250717_213306_encoded.mp4"

# Subir el video a Cloudinary
try:
    result = cloudinary.uploader.upload(video_path, resource_type="video", folder="test_folder")
    print("Video subido con éxito:", result)
except Exception as e:
    print("Error al subir el video:", e)
