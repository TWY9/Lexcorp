from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector

app = Flask(__name__)
app.secret_key = "clave_secreta"

# Conexión BD
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mark25102004974.",  # tu contraseña de MySQL
        database="lexcorp"
    )

# Página de login
@app.route("/", methods=["GET"])
def home():
    return render_template("inicio.html")

@app.route("/login", methods=["POST"])
def login():
    usuario = request.form["usuario"]
    contrasena = request.form["contrasena"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM clientes WHERE usuario=%s AND contrasena=%s",
        (usuario, contrasena)
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        session["usuario"] = user["usuario"]
        return redirect(url_for("inicio"))
    else:
        return "Usuario o contraseña incorrectos"

# Página de inicio después de login
@app.route("/inicio")
def inicio():
    if "usuario" in session:
        return render_template("inicio.html", usuario=session["usuario"])
    return redirect(url_for("home"))

# Endpoint para mostrar servicios (ejemplo)
@app.route("/servicios")
def servicios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT nombre, costo FROM servicios")
        data = cursor.fetchall()
        conn.close()
        return jsonify(data)
    except:
        return jsonify([
            {"nombre": "Asesoría Legal", "costo": 500},
            {"nombre": "Defensa Penal", "costo": 1200}
        ])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
