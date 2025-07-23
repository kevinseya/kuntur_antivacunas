from flask import Blueprint, jsonify, request
from services.capture_service import start_capture_thread, stop_capture, store_local_info

capture_bp = Blueprint('capture', __name__)

# Ruta para iniciar la captura de audio
@capture_bp.route('/start-capture', methods=['POST'])
def start_capture():
    """Inicia la captura de audio"""
    try:
        # Recibir los parámetros enviados desde la solicitud POST
        data = request.get_json()
        
        # Recibir la latitud, longitud, nombre_local e ip_camara
        latitud = data.get('latitud')
        longitud = data.get('longitud')
        nombre_local = data.get('nombre_local')
        ip_camara = data.get('ip_camara')  # Este se puede almacenar pero no es necesario pasar a las funciones

        # Almacenar la información del local
        store_local_info(latitud, longitud, nombre_local, ip_camara)
        
        # Llamar a la función que inicia la captura (la ip_camara se maneja globalmente)
        start_capture_thread()
        
        return jsonify({"message": "Captura de audio iniciada."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Ruta para detener la captura de audio
@capture_bp.route('/stop-capture', methods=['POST'])
def stop_capture_route():
    """Detiene la captura de audio"""
    try:
        stop_capture()
        return jsonify({"message": "Captura de audio detenida."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500