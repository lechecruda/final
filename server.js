const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de middlewares de Express para parsear JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static(__dirname));

// ==================================================================
// 1. OBTENCIÓN Y LIMPIEZA DE LA CADENA DE CONEXIÓN (URI)
// ==================================================================
let MONGO_URI = process.env.MONGODB_URI || '';

if (MONGO_URI) {
  // Elimina comillas adicionales y asegura el formateo correcto de caracteres especiales (% -> %25)
  MONGO_URI = MONGO_URI.trim().replace(/^["']|["']$/g, '');
  if (MONGO_URI.includes('%') && !MONGO_URI.includes('%25')) {
    MONGO_URI = MONGO_URI.replace(/%(?![0-9a-fA-F]{2})/g, '%25');
  }
}

// Desactiva el almacenamiento en búfer de comandos si no hay conexión activa
mongoose.set('bufferCommands', false);

// ==================================================================
// 2. DEFINICIÓN DE ESQUEMAS Y MODELOS DE MONGOOSE
// ==================================================================

// Esquema para la colección de Productos
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  sku: { type: String, default: '' },
  marca: { type: String, default: '' },
  categoria: { type: String, required: true },
  precio: { type: Number, required: true },
  stock: { type: Number, required: true },
  proveedor: { type: String, default: '' },
  ubicacion: { type: String, default: '' },
  descripcion: { type: String, default: '' }
}, { collection: 'productos', timestamps: true });

// Esquema para la colección de Usuarios
const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apPaterno: { type: String, required: true },
  apMaterno: { type: String, default: '' },
  usuario: { type: String, required: true, unique: true },
  correo: { type: String, required: true },
  telefono: { type: String, default: '' },
  identificacion: { type: String, default: '' },
  direccion: { type: String, default: '' },
  password: { type: String, required: true },
  estado: { type: String, default: 'Activo' }
}, { collection: 'usuarios', timestamps: true });

// Modelos para interactuar con MongoDB
const Producto = mongoose.model('Producto', ProductoSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// ==================================================================
// 3. AQUÍ SE CONECTA A LA BASE DE DATOS (MIDDLEWARE DE CONEXIÓN)
// ==================================================================
async function asegurarConexion(req, res, next) {
  // Si la conexión ya está establecida (readyState === 1), continúa a la siguiente función (next)
  if (mongoose.connection.readyState === 1) return next();

  // Valida que exista la variable de entorno MONGODB_URI
  if (!MONGO_URI) return res.status(500).json({ error: 'Falta MONGODB_URI en las variables de entorno' });

  try {
    // ➔ AQUÍ OCURRE LA CONEXIÓN A MONGODB / AZURE COSMOS DB
    await mongoose.connect(MONGO_URI, {
      dbName: 'Productos',            // Nombre de la base de datos objetivo
      serverSelectionTimeoutMS: 5000, // Tiempo límite para seleccionar servidor (5s)
      connectTimeoutMS: 5000          // Tiempo límite para establecer conexión inicial (5s)
    });
    
    next(); // Conexión exitosa, pasa a procesar la ruta solicitada
  } catch (err) {
    // Error al conectar
    return res.status(503).json({ error: 'Error de conexión: ' + err.message });
  }
}

// ==================================================================
// 4. RUTAS DE LA API - PRODUCTOS
// ==================================================================

// Obtener todos los productos
app.get('/api/productos', asegurarConexion, async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo producto
app.post('/api/productos', asegurarConexion, async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar un producto por ID
app.put('/api/productos/:id', asegurarConexion, async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un producto por ID
app.delete('/api/productos/:id', asegurarConexion, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================================================================
// 5. RUTAS DE LA API - USUARIOS Y AUTENTICACIÓN
// ==================================================================

// Obtener todos los usuarios
app.get('/api/usuarios', asegurarConexion, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo usuario
app.post('/api/usuarios', asegurarConexion, async (req, res) => {
  try {
    const nuevo = new Usuario(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Modificar usuario por ID (PUT)
app.put('/api/usuarios/:id', asegurarConexion, async (req, res) => {
  try {
    // Si al editar no envían contraseña nueva, se conserva la actual
    if (!req.body.password) {
      delete req.body.password;
    }
    const actualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un usuario por ID
app.delete('/api/usuarios/:id', asegurarConexion, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint de Inicio de Sesión (Login)
app.post('/api/login', asegurarConexion, async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const user = await Usuario.findOne({ usuario, password });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    if (user.estado === 'Inactivo') {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo' });
    }
    res.json({ mensaje: 'Acceso concedido', usuario: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================================================================
// 6. RUTAS PARA SERVIR LAS VISTAS (FRONTEND FALLBACK)
// ==================================================================

// Ruta raíz (/) -> Muestra login.html por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Ruta comodín (*) -> Redirige cualquier otra petición no válida a login.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ==================================================================
// 7. INICIO DEL SERVIDOR
// ==================================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
