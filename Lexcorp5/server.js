require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const xss = require("xss");
// ✅ AGREGA ESTOS IMPORTS PARA HTTPS
const https = require("https");
const http = require("http");
const fs = require("fs");
const os = require("os");

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();

// CONFIG
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/lexcorp";
const SESSION_SECRET = process.env.SESSION_SECRET || "cambiar_esto";
const SALT = 10;

// ✅ DETECCIÓN AUTOMÁTICA DE IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  console.log('🔍 Escaneando interfaces de red...');

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Solo IPv4 y no interfaces internas
      if (interface.family === 'IPv4' && !interface.internal) {
        // Filtrar por redes locales comunes
        if (interface.address.startsWith('192.168.') ||
          interface.address.startsWith('10.31.') ||
          interface.address.startsWith('172.')) {

          console.log(`📡 Encontrada: ${interface.address} en ${name}`);
          ips.push({
            address: interface.address,
            name: name,
            isWifi: name.toLowerCase().includes('wi-fi') ||
              name.toLowerCase().includes('wireless') ||
              name.toLowerCase().includes('wlan')
          });
        }
      }
    }
  }

  // Priorizar WiFi
  const wifiIP = ips.find(ip => ip.isWifi);
  if (wifiIP) {
    console.log(`📶 Usando IP WiFi: ${wifiIP.address} (${wifiIP.name})`);
    return wifiIP.address;
  }

  // Si no hay WiFi, usar la primera IP disponible
  if (ips.length > 0) {
    console.log(`🔌 Usando IP Ethernet: ${ips[0].address} (${ips[0].name})`);
    return ips[0].address;
  }

  console.log('⚠️  No se encontraron IPs locales, usando localhost');
  return 'localhost';
}

// CONFIGURACIÓN RED LOCAL CON DETECCIÓN AUTOMÁTICA
const LOCAL_IP = getLocalIP();
const HOSTNAME = os.hostname().toLowerCase();
const HTTPS_PORT = 3443;

// MIDDLEWARE
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// CONEXIÓN MONGODB
mongoose.connect(MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Error Mongo:", err));

const Usuario = require("./models/Usuario");
const Servicio = require("./models/Servicio");

// SESIONES
app.use(session({
  secret: SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// MIDDLEWARE DE ROLES
function roleRequired(roles) {
  return (req, res, next) => {
    if (!req.session.usuario) return res.redirect("/");
    if (!roles.includes(req.session.rol)) return res.status(403).send("Acceso denegado.");
    next();
  };
}

// LOGIN PAGE
app.get("/", (req, res) => res.render("login"));

// LOGIN POST
app.post("/login",
  body("usuario").trim().notEmpty(),
  body("contrasena").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.send("Rellena todos los campos");

    const usuario = xss(req.body.usuario);
    const contrasena = req.body.contrasena;

    const user = await Usuario.findOne({ usuario });
    if (!user) return res.send("Usuario o contraseña incorrectos");

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.send("Usuario o contraseña incorrectos");

    req.session.usuario = user.usuario;
    req.session.rol = user.rol;
    res.redirect("/inicio");
  }
);

// REGISTRO PAGE
app.get("/registro", (req, res) => res.render("registro"));

// AJAX VALIDAR USUARIO
app.get("/check-usuario", async (req, res) => {
  const q = (req.query.usuario || "").trim();
  if (!q) return res.json({ ok: false });

  const existe = await Usuario.exists({ usuario: q });
  res.json({ ok: true, disponible: !existe });
});

// REGISTRO POST - MEJORADO CON MANEJO DE ERRORES EN JSON
app.post("/registro",
  body("usuario").trim().isLength({ min: 3 }),
  body("correo").isEmail(),
  body("contrasena").isLength({ min: 8 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("mensaje", {
          titulo: "Datos inválidos",
          success: false,
          mensaje: "Por favor llena todos los campos correctamente."
        });
      }

      const usuario = xss(req.body.usuario);
      const nombre = xss(req.body.nombre || "");
      const correo = xss(req.body.correo || "");
      const contrasena = req.body.contrasena;

      const usuarioExistente = await Usuario.findOne({ usuario });
      if (usuarioExistente) {
        return res.status(400).render("mensaje", {
          titulo: "Usuario existente",
          success: false,
          mensaje: "❌ Este usuario ya existe. Por favor elige otro nombre."
        });
      }

      const correoExistente = await Usuario.findOne({ correo });
      if (correoExistente) {
        return res.status(400).render("mensaje", {
          titulo: "Correo existente",
          success: false,
          mensaje: "❌ Este correo ya está registrado."
        });
      }

      const hash = await bcrypt.hash(contrasena, SALT);

      await new Usuario({
        usuario,
        contrasena: hash,
        rol: "cliente",
        nombre,
        correo
      }).save();

      return res.render("mensaje", {
        titulo: "Registro exitoso",
        success: true,
        mensaje: "¡Tu cuenta fue creada correctamente! Te enviaremos al login...",
      });


    } catch (err) {
      console.error(err);

      return res.status(500).render("mensaje", {
        titulo: "Error inesperado",
        success: false,
        mensaje: "❌ Error interno del servidor. Intenta más tarde."

      });
    }
  });


// INICIO
app.get("/inicio", async (req, res) => {
  if (!req.session.usuario) return res.redirect("/");
  const servicios = await Servicio.find();
  res.render("inicio", { usuario: req.session.usuario, rol: req.session.rol, servicios });
});

// ADMIN
app.get("/admin", roleRequired(["admin"]), async (req, res) => {
  const servicios = await Servicio.find();
  res.render("admin", { servicios });
});

// AGREGAR SERVICIO
app.post("/agregar_servicio", roleRequired(["admin"]), async (req, res) => {
  await new Servicio({
    nombre: xss(req.body.nombre),
    descripcion: xss(req.body.descripcion),
    costo: parseFloat(req.body.costo)
  }).save();

  res.redirect("/admin");
});

// ACTUALIZAR
app.post("/actualizar_servicio", roleRequired(["admin"]), async (req, res) => {
  await Servicio.findByIdAndUpdate(req.body.id, {
    nombre: xss(req.body.nombre),
    descripcion: xss(req.body.descripcion),
    costo: parseFloat(req.body.costo)
  });
  res.redirect("/admin");
});

// ELIMINAR
app.post("/eliminar_servicio", roleRequired(["admin"]), async (req, res) => {
  await Servicio.findByIdAndDelete(req.body.id);
  res.redirect("/admin");
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ESTADO BD
app.get("/conexion", (req, res) => {
  const estado = mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado";
  res.render("conexion", { estado });
});

// CRUD DE USUARIOS SOLO ADMIN
app.use('/admin/usuarios', require('./routes/adminUsuarios'));

// ✅ RUTAS ESPECÍFICAS PARA CADA TIPO DE ARCHIVO

// Para imagen
app.get("/github-image", async (req, res) => {
  try {
    console.log("🔄 Solicitando imagen desde GitHub...");
    const imageUrl = 'https://raw.githubusercontent.com/TWY9/Lexcorp/main/Lexcorpv4.0/public/abogados.png';

    console.log("📥 URL Imagen:", imageUrl);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error("❌ Error GitHub Imagen:", response.status, response.statusText);
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buffer);

    console.log("✅ Imagen servida correctamente desde GitHub");
  } catch (error) {
    console.error("❌ Error cargando imagen:", error);
    res.status(500).send("Error cargando imagen");
  }
});


// ============================================================================
// ✅ CONFIGURACIÓN PARA AZURE APP SERVICE (WINDOWS) Y DESARROLLO LOCAL
// ============================================================================

// Detectar si estamos en Azure o desarrollo local
const isAzure = process.env.WEBSITE_SITE_NAME || process.env.AZURE_APP_SERVICE;

if (!isAzure && fs.existsSync('localhost+3-key.pem') && fs.existsSync('localhost+3.pem')) {
  // ✅ DESARROLLO LOCAL - Usar HTTPS
  const SSL_OPTIONS = {
    key: fs.readFileSync('localhost+3-key.pem'),
    cert: fs.readFileSync('localhost+3.pem')
  };

  const LOCAL_IP = getLocalIP();
  const HOSTNAME = os.hostname().toLowerCase();
  const HTTPS_PORT = 3443;

  https.createServer(SSL_OPTIONS, app).listen(HTTPS_PORT, LOCAL_IP, () => {
    console.log('='.repeat(70));
    console.log('🚀 SERVIDOR LEXCORP HTTPS - DESARROLLO LOCAL');
    console.log('='.repeat(70));
    console.log(`📍 IP Detectada: ${LOCAL_IP}`);
    console.log(`🔐 HTTPS Local: https://localhost:${HTTPS_PORT}`);
    console.log(`🌐 HTTPS Red: https://${LOCAL_IP}:${HTTPS_PORT}`);
    console.log('='.repeat(70));
  });

  // Redirección HTTP para desarrollo
  http.createServer((req, res) => {
    res.writeHead(301, {
      "Location": `https://${LOCAL_IP}:${HTTPS_PORT}${req.url}`
    });
    res.end();
  }).listen(PORT, LOCAL_IP, () => {
    console.log(`🔁 Redirección HTTP→HTTPS en: http://${LOCAL_IP}:${PORT}`);
  });

} else {
  // ✅ AZURE APP SERVICE - Usar HTTP normal (Azure maneja HTTPS)
  app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('🚀 SERVIDOR LEXCORP - AZURE APP SERVICE');
    console.log('='.repeat(70));
    console.log(`✅ Puerto: ${PORT}`);
    console.log(`✅ Entorno: ${isAzure ? 'Azure Production' : 'Local without SSL'}`);
    console.log('='.repeat(70));
    console.log('✅ Aplicación lista');
    console.log('='.repeat(70));
  });
}

// Manejo graceful de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor... ¡Hasta pronto!');
  process.exit(0);
});