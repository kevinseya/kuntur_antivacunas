# app.py
import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from routes.capture_routes import capture_bp

# 1. Carga configuración de .env
load_dotenv()
PORT = int(os.getenv('PORT', 5001))

# 2. Inicializa Flask y CORS
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 3. Inicializa SocketIO con configuración mejorada
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    logger=True,  # Habilitar logs para debugging
    engineio_logger=True,  # Logs más detallados
    transport=['websocket', 'polling']  # Permitir ambos transportes
)

# 4. Registra tus rutas REST de captura
app.register_blueprint(capture_bp, url_prefix='/audio')

# 5. Event handlers para WebSocket
@socketio.on('connect')
def handle_connect():
    print(f'🔌 Cliente conectado via WebSocket desde {request.remote_addr if "request" in globals() else "unknown"}')
    emit('connection_response', {'data': 'Conectado exitosamente'})

@socketio.on('disconnect')
def handle_disconnect():
    print('📤 Cliente desconectado')

# 6. Función para emitir transcripciones (será llamada desde otros módulos)
def emit_transcription(text):
    """Función para emitir transcripciones a todos los clientes conectados"""
    print(f"📡 Emitiendo transcripción: {text}")
    socketio.emit('new_transcription', {'text': text})

# 7. Ruta de comprobación
@app.route('/')
def index():
    return f'🔌 WebSocket & Capture Server Running on {PORT}'

@app.route('/health')
def health():
    return {'status': 'ok', 'port': PORT}

# 8. Arranca con SocketIO
if __name__ == '__main__':
    print(f"🚀 Iniciando servidor en 0.0.0.0:{PORT}")
    socketio.run(
        app,
        host="0.0.0.0",  # Escuchar en todas las interfaces
        port=PORT,
        debug=True,
        allow_unsafe_werkzeug=True  # Para desarrollo
    )