// server.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Sesiones
app.use(session({
  secret: "clave_secreta",
  resave: false,
  saveUninitialized: false
}));

// Conexión a MongoDB
mongoose.connect("mongodb://localhost:27017/lexcorp")
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.log("Error al conectar:", err));

// Modelos
const Cliente = mongoose.model("Cliente", new mongoose.Schema({
  usuario: String,
  nombre: String,
  correo: String,
  contrasena: String,
  rol: String
}));

const Servicio = mongoose.model("Servicio", new mongoose.Schema({
  nombre: String,
  descripcion: String,
  costo: Number
}));

// Middleware para roles
function roleRequired(roles) {
  return (req, res, next) => {
    if (!req.session.usuario || !req.session.rol) return res.redirect("/");
    if (!roles.includes(req.session.rol)) return res.send("Acceso denegado: no tienes permisos suficientes");
    next();
  };
}

// Rutas

// Login
app.get("/", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  const user = await Cliente.findOne({ usuario, contrasena });
  if (user) {
    req.session.usuario = user.usuario;
    req.session.rol = user.rol || "user";
    res.redirect("/inicio");
  } else {
    res.send("Usuario o contraseña incorrectos");
  }
});

// Registro
app.get("/registro", (req, res) => res.render("registro", { mensaje: "" }));

app.post("/registro", async (req, res) => {
  const { usuario, correo, nombre, contrasena, confirmar_contrasena } = req.body;

  if (contrasena !== confirmar_contrasena) {
    return res.render("registro", { mensaje: "Las contraseñas no coinciden" });
  }

  const nuevoCliente = new Cliente({ usuario, correo, nombre, contrasena, rol: "user" });
  await nuevoCliente.save();
  res.redirect("/");
});

// Página de inicio
app.get("/inicio", async (req, res) => {
  if (!req.session.usuario) return res.redirect("/");
  const servicios = await Servicio.find();
  res.render("inicio", { usuario: req.session.usuario, rol: req.session.rol, servicios });
});

// Panel de admin
app.get("/admin", roleRequired(["admin"]), async (req, res) => {
  const servicios = await Servicio.find();
  res.render("admin", { servicios });
});

// Agregar servicio
app.post("/agregar_servicio", roleRequired(["admin"]), async (req, res) => {
  const { nombre, descripcion, costo } = req.body;
  const nuevoServicio = new Servicio({ nombre, descripcion, costo });
  await nuevoServicio.save();
  res.redirect("/admin");
});

// Actualizar servicio
app.post("/actualizar_servicio", roleRequired(["admin"]), async (req, res) => {
  const { id, nombre, descripcion, costo } = req.body;
  await Servicio.findByIdAndUpdate(id, { nombre, descripcion, costo });
  res.redirect("/admin");
});

// Eliminar servicio
app.post("/eliminar_servicio", roleRequired(["admin"]), async (req, res) => {
  const { id } = req.body;
  await Servicio.findByIdAndDelete(id);
  res.redirect("/admin");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Servidor
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
