const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  usuario: String,
  contrasena: String,
  rol: { type: String, default: "cliente" }
});

module.exports = mongoose.model("Usuario", usuarioSchema);
