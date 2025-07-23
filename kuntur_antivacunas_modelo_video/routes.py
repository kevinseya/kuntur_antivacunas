from flask import Blueprint, request, jsonify

def create_routes(app, detection_flag, descripciones_por_track, collection):
    @app.route('/start_detection', methods=['POST'])
    def start_detection():
        if detection_flag['active']:
            return jsonify({"status": "warning", "message": "La detección ya está activa"}), 400
        detection_flag['active'] = True
        descripciones_por_track.clear()

        # Captura y imprime el JSON que se recibe
        request_data = request.get_json()  # Captura el cuerpo de la solicitud
        print("Datos recibidos:", request_data)  # Imprime el JSON recibido

        # Tomamos los datos recibidos para pasarlos a la detección
        latitud = request_data.get('latitud')
        longitud = request_data.get('longitud')
        nombre_local = request_data.get('nombre_local')
        ip_camara = request_data.get('ip_camara')
        
        from detection import detection_loop
        import threading
        thread = threading.Thread(target=detection_loop, args=(
            app.config['model'], app.config['processor'], app.config['blip_model'],
            app.config['device'], collection, app.config['carpetas_frames'],
            detection_flag, descripciones_por_track, latitud, longitud, nombre_local, ip_camara
        ))
        thread.daemon = True
        thread.start()

        return jsonify({"status": "success", "message": "Detección iniciada correctamente"}), 200

    @app.route('/stop_detection', methods=['POST'])
    def stop_detection():
        if not detection_flag['active']:
            return jsonify({"status": "warning", "message": "La detección no está activa"}), 400
        detection_flag['active'] = False
        return jsonify({"status": "success", "message": "Detección detenida correctamente"}), 200

    @app.route('/status', methods=['GET'])
    def status():
        return jsonify({
            "detection_active": detection_flag['active'],
            "device": app.config['device'],
            "tracked_weapons": len(descripciones_por_track),
            "mongo_connected": True
        })

    @app.route('/alerts', methods=['GET'])
    def alerts():
        try:
            alerts = list(collection.find().sort("timestamp", -1).limit(10))
            for alert in alerts:
                alert['_id'] = str(alert['_id'])
                alert['timestamp'] = alert['timestamp'].isoformat()
            return jsonify({"status": "success", "alerts": alerts})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)})

    @app.route('/health', methods=['GET'])
    def health():
        from datetime import datetime
        return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})