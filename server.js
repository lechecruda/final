const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

let MONGO_URI = process.env.MONGODB_URI || '';

if (MONGO_URI) {
  MONGO_URI = MONGO_URI.trim().replace(/^["']|["']$/g, '');
  if (MONGO_URI.includes('%') && !MONGO_URI.includes('%25')) {
    MONGO_URI = MONGO_URI.replace(/%(?![0-9a-fA-F]{2})/g, '%25');
  }
}

mongoose.set('bufferCommands', false);

// ------------------------------------------------------------------
// SCHEMAS AMPLIADOS
// ------------------------------------------------------------------
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
  rol: { type: String, required: true },
  estado: { type: String, default: 'Activo' }
}, { collection: 'usuarios', timestamps: true });

const Producto = mongoose.model('Producto', ProductoSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Middleware de conexión
async function asegurarConexion(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  if (!MONGO_URI) return res.status(500).json({ error: 'Falta MONGODB_URI en Azure' });

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'Productos',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    next();
  } catch (err) {
    return res.status(503).json({ error: 'Error de conexión: ' + err.message });
  }
}

// API PRODUCTOS
app.get('/api/productos', asegurarConexion, async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/productos', asegurarConexion, async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/productos/:id', asegurarConexion, async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/productos/:id', asegurarConexion, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API USUARIOS
app.get('/api/usuarios', asegurarConexion, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', asegurarConexion, async (req, res) => {
  try {
    const nuevo = new Usuario(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', asegurarConexion, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
