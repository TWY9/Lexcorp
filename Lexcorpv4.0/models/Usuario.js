const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: { type: String, default: "cliente" },
  nombre: String,
  correo: String,
  creado_en: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Usuario", usuarioSchema);