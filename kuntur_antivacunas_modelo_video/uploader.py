import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_video_to_cloudinary(video_path, public_id=None, folder="alerta_videos"):
    try:
        options = {
            "resource_type": "video"
        }
        if public_id:
            options["public_id"] = public_id
        if folder:
            options["folder"] = folder  # Carpeta donde lo guardarás
        result = cloudinary.uploader.upload_large(video_path, **options)
        return result.get("secure_url")
    except Exception as e:
        print(f"❌ Error subiendo a Cloudinary: {e}")
        return None

def upload_frame_to_cloudinary(frame_path, public_id=None, folder="alerta_frames"):
    try:
        options = {
            "resource_type": "image"  
        }
        if public_id:
            options["public_id"] = public_id
        if folder:
            options["folder"] = folder  
        
        result = cloudinary.uploader.upload(frame_path, **options)  
        return result.get("secure_url")
    except Exception as e:
        print(f"❌ Error subiendo a Cloudinary: {e}")
        return None
