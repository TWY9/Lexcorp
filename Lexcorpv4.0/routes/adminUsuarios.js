const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// ⭐ Middleware SIN carpeta middlewares
const roleRequired = (roles) => {
    return (req, res, next) => {
        if (!req.session.usuario) return res.redirect("/");
        if (!roles.includes(req.session.rol)) return res.status(403).send("Acceso denegado.");
        next();
    };
};

// LISTAR USUARIOS
router.get('/', roleRequired(["admin"]), async (req, res) => {
    const usuarios = await Usuario.find();
    res.render('admin/usuarios', { usuarios });
});

// FORMULARIO AGREGAR USUARIO
router.get('/agregar', roleRequired(["admin"]), (req, res) => {
    res.render('admin/agregar_usuario');
});

// GUARDAR USUARIO NUEVO
router.post('/agregar', roleRequired(["admin"]), async (req, res) => {
    const { usuario, password, rol } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await Usuario.create({
        usuario,
        contrasena: hashed,
        rol
    });

    res.redirect('/admin/usuarios');
});

// FORMULARIO EDITAR
router.get('/editar/:id', roleRequired(["admin"]), async (req, res) => {
    const usuario = await Usuario.findById(req.params.id);
    res.render('admin/editar_usuario', { usuario });
});

// GUARDAR EDICIÓN
router.post('/editar/:id', roleRequired(["admin"]), async (req, res) => {
    const { usuario, rol } = req.body;

    await Usuario.findByIdAndUpdate(req.params.id, {
        usuario,
        rol
    });

    res.redirect('/admin/usuarios');
});

// ELIMINAR
router.get('/eliminar/:id', roleRequired(["admin"]), async (req, res) => {
    await Usuario.findByIdAndDelete(req.params.id);
    res.redirect('/admin/usuarios');
});

// AJAX BUSCAR USUARIOS
router.get('/buscar', roleRequired(["admin"]), async (req, res) => {
    const q = req.query.q || '';

    const usuarios = await Usuario.find({
        usuario: { $regex: q, $options: 'i' }
    });

    res.json(usuarios);
});

module.exports = router;