const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

// Sanitización de la URI para evitar "URI malformed"
let MONGO_URI = process.env.MONGODB_URI || '';
if (MONGO_URI) {
  MONGO_URI = MONGO_URI.trim().replace(/^["']|["']$/g, '');
}

// Desactivar buffering para respuestas inmediatas
mongoose.set('bufferCommands', false);

// Modelos
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  precio: { type: Number, required: true },
  stock: { type: Number, required: true }
}, { collection: 'productos', timestamps: true });

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  rol: { type: String, required: true }
}, { collection: 'usuarios', timestamps: true });

const Producto = mongoose.model('Producto', ProductoSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Middleware de conexión
async function asegurarConexion(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  if (!MONGO_URI) {
    return res.status(500).json({ error: 'La variable MONGODB_URI no existe en Azure' });
  }

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'Productos',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    next();
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err.message);
    return res.status(503).json({ error: 'No se pudo conectar a MongoDB: ' + err.message });
  }
}

// API ENDPOINTS - PRODUCTOS
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
    const { nombre, categoria, precio, stock } = req.body;
    const nuevo = new Producto({
      nombre,
      categoria,
      precio: Number(precio),
      stock: Number(stock)
    });
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

// API ENDPOINTS - USUARIOS
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
