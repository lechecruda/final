const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

// Cadena de conexión
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { dbName: 'Productos' })
    .then(() => console.log('✅ Conectado a MongoDB en Azure'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err.message));
} else {
  console.error('CRÍTICO: MONGODB_URI no existe en variables de entorno');
}

// ------------------------------------------------------------------
// SCHEMAS Y MODELOS
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// API ENDPOINTS - PRODUCTOS
// ------------------------------------------------------------------
app.get('/api/productos', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Conectando a la base de datos... Reintenta en unos segundos.' });
    }
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'La base de datos aún no está lista o rechazó la conexión de Azure.' });
    }
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

app.put('/api/productos/:id', async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// API ENDPOINTS - USUARIOS
// ------------------------------------------------------------------
app.get('/api/usuarios', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Base de datos desconectada' });
    }
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Base de datos desconectada' });
    }
    const nuevo = new Usuario(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Servir la página principal si no coincide ninguna ruta API
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
