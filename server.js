const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

// Lee la variable MONGODB_URI que configuraste en Azure App Service
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    dbName: 'Productos', // Especifica tu base de datos de Compass
    serverSelectionTimeoutMS: 5000 // Cancela si la BD no responde en 5s
  })
  .then(() => console.log('Conectado exitosamente a la BD "Productos" en Azure'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));
} else {
  console.error('ERROR CRÍTICO: No se encontró MONGODB_URI en las variables de entorno');
}

// ------------------------------------------------------------------
// SCHEMAS Y MODELOS (Apuntando a tus colecciones exactas)
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
    const productos = await Producto.find().maxTimeMS(5000);
    res.json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al consultar la base de datos: ' + err.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error('Error al guardar producto:', err);
    res.status(400).json({ error: 'No se pudo guardar el producto: ' + err.message });
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
    const usuarios = await Usuario.find().maxTimeMS(5000);
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    const guardado = await nuevoUsuario.save();
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

// Servir la aplicación Web
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
