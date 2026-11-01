const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

// Lee la variable MONGODB_URI configurada en Azure
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI) {
  // Se añade dbName: 'Productos' para que Mongoose use directamente esa BD
  mongoose.connect(MONGO_URI, { dbName: 'Productos' })
    .then(() => console.log('Conectado a la base de datos "Productos" en Azure'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));
}

// ------------------------------------------------------------------
// MODELOS DE MONGOOSE (Mapeados a tus colecciones exactas)
// ------------------------------------------------------------------

// Mapea a la colección "productos"
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  precio: { type: Number, required: true },
  stock: { type: Number, required: true }
}, { collection: 'productos', timestamps: true });

// Mapea a la colección "usuarios"
const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  rol: { type: String, required: true }
}, { collection: 'usuarios', timestamps: true });

const Producto = mongoose.model('Producto', ProductoSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// ------------------------------------------------------------------
// ENDPOINTS API - PRODUCTOS
// ------------------------------------------------------------------

// GET: Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Crear nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Actualizar un producto por ID
app.put('/api/productos/:id', async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Eliminar un producto por ID
app.delete('/api/productos/:id', async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// ENDPOINTS API - USUARIOS
// ------------------------------------------------------------------

// GET: Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    res.status(201).json(nuevoUsuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Eliminar un usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// RUTA PRINCIPAL Y SERVIDOR
// ------------------------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
