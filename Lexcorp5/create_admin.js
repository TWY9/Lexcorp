require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/lexcorp";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";

(async () => {
  await mongoose.connect(MONGO_URI);

  const existe = await Usuario.findOne({ usuario: ADMIN_USER });
  if (existe) {
    console.log("El admin ya existe");
    process.exit(0);
  }

  const hash = await bcrypt.hash(ADMIN_PASS, 10);

  await new Usuario({
    usuario: ADMIN_USER,
    contrasena: hash,
    rol: "admin",
    nombre: "Administrador",
    correo: ""
  }).save();

  console.log("Administrador creado.");
  process.exit(0);
})();