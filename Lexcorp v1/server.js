const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();


mongoose.connect("mongodb://localhost:27017/lexcorp", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Conectado a MongoDB"))
.catch(err => console.log("Error al conectar:", err));


const Cliente = mongoose.model("Cliente", new mongoose.Schema({
    nombre: String,
    correo: String,
    telefono: String
}));

const Servicio = mongoose.model("Servicio", new mongoose.Schema({
    nombre: String,
    descripcion: String,
    costo: Number
}));


app.use(express.static(path.join(__dirname, "public")));


app.get("/clientes", async (req, res) => {
    const clientes = await Cliente.find();
    res.json(clientes);
});

app.get("/servicios", async (req, res) => {
    const servicios = await Servicio.find();
    res.json(servicios);
});


app.listen(5000, "0.0.0.0", () => {
    console.log("Servidor corriendo en http://10.31.6.109:5000");
});
