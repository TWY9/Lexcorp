const mongoose = require("mongoose");

const servicioSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  costo: Number
});

module.exports = mongoose.model("Servicio", servicioSchema);