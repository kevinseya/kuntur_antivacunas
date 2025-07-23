from flask import Blueprint, render_template, request, redirect, session, jsonify
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from services.db import coleccion_usuarios

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nombre = request.form["nombre_local"]
        password = request.form["password"]

        usuario = coleccion_usuarios.find_one({"nombre_local": nombre})
        if usuario and check_password_hash(usuario["password"], password):
            session["usuario_id"] = str(usuario["_id"])
            session["ip_camara"] = usuario["ip_camara"]
            session["nombre_local"] = usuario["nombre_local"]
            session['ubicacion'] = usuario["ubicacion"]
            session['latitud'] = usuario["latitud"]
            session['longitud'] = usuario["longitud"]
            
            # Si es una petición desde la app móvil, devolver JSON
            if request.headers.get('Content-Type') == 'application/json' or request.headers.get('Accept') == 'application/json':
                return jsonify({
                    "success": True,
                    "message": "Login exitoso",
                    "user": {
                        "nombre_local": usuario["nombre_local"],
                        "ip_camara": usuario["ip_camara"],
                        "ubicacion": usuario["ubicacion"],
                        "latitud": usuario["latitud"],
                        "longitud": usuario["longitud"]
                    }
                })
            
            return redirect("/panel")
        else:
            # Si es una petición desde la app móvil, devolver error JSON
            if request.headers.get('Content-Type') == 'application/json' or request.headers.get('Accept') == 'application/json':
                return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401
            
            return render_template("login.html", error="Credenciales incorrectas")

    return render_template("login.html")


@auth_bp.route("/registrar", methods=["GET", "POST"])
def registrar():
    if request.method == "POST":
        nombre = request.form["nombre_local"]
        ubicacion = request.form["ubicacion"]
        ip_camara = request.form["ip_camara"]
        lat = request.form.get("latitud")
        lng = request.form.get("longitud")
        password = generate_password_hash(request.form["password"])

        # Verificar si el usuario ya existe
        if coleccion_usuarios.find_one({"nombre_local": nombre}):
            # Si es una petición desde la app móvil, devolver error JSON
            if request.headers.get('Accept') == 'application/json':
                return jsonify({"success": False, "message": "El nombre del local ya existe"}), 400
            
            return render_template("registro.html", error="El nombre del local ya existe")

        # Insertar nuevo usuario
        try:
            coleccion_usuarios.insert_one({
                "nombre_local": nombre,
                "ubicacion": ubicacion,
                "ip_camara": ip_camara,
                "latitud": float(lat) if lat else None,
                "longitud": float(lng) if lng else None,
                "password": password
            })
            
            # Si es una petición desde la app móvil, devolver éxito JSON
            if request.headers.get('Accept') == 'application/json':
                return jsonify({"success": True, "message": "Usuario registrado exitosamente"}), 201
            
            return redirect("/")
            
        except Exception as e:
            # Si es una petición desde la app móvil, devolver error JSON
            if request.headers.get('Accept') == 'application/json':
                return jsonify({"success": False, "message": f"Error al registrar: {str(e)}"}), 500
            
            return render_template("registro.html", error="Error al registrar usuario")

    return render_template("registro.html")


# Nuevos endpoints para la app móvil
@auth_bp.route("/api/register", methods=["POST"])
def api_register():
    """Endpoint específico para la app móvil"""
    try:
        data = request.get_json() if request.is_json else request.form
        
        nombre = data.get("nombre_local")
        ubicacion = data.get("ubicacion")
        ip_camara = data.get("ip_camara")
        lat = data.get("latitud")
        lng = data.get("longitud")
        password = data.get("password")
        
        # Validar datos requeridos
        if not all([nombre, ubicacion, ip_camara, password]):
            return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400
        
        # Verificar si el usuario ya existe
        if coleccion_usuarios.find_one({"nombre_local": nombre}):
            return jsonify({"success": False, "message": "El nombre del local ya existe"}), 400
        
        # Insertar nuevo usuario
        coleccion_usuarios.insert_one({
            "nombre_local": nombre,
            "ubicacion": ubicacion,
            "ip_camara": ip_camara,
            "latitud": float(lat) if lat else None,
            "longitud": float(lng) if lng else None,
            "password": generate_password_hash(password)
        })
        
        return jsonify({"success": True, "message": "Usuario registrado exitosamente"}), 201
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error al registrar: {str(e)}"}), 500


@auth_bp.route("/panel")
def panel():
    if "usuario_id" not in session:
        return redirect("/")

    usuario = coleccion_usuarios.find_one({"_id": ObjectId(session["usuario_id"])})
    if not usuario:
        return redirect("/")

    return render_template(
        "index.html",
        ip_camera=usuario["ip_camara"],
        nombre_local=usuario["nombre_local"],
        ubicacion=usuario["ubicacion"],
    )