const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGODB_URI;

// Configuración de conexión tolerante a TLS de Azure
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    dbName: 'Productos',
    tls: true,
    tlsAllowInvalidCertificates: true,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000
  })
  .then(() => console.log('✅ Conectado exitosamente a la BD "Productos" en Azure'))
  .catch(err => console.error('❌ Error de conexión:', err.message));
} else {
  console.error('CRÍTICO: No se encontró MONGODB_URI en las variables de entorno');
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
// ENDPOINTS API - PRODUCTOS
// ------------------------------------------------------------------
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    console.error('Error GET /api/productos:', err);
    res.status(500).json({ error: 'Error al consultar la BD: ' + err.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;
    
    if (!nombre || !categoria || precio === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevoProducto = new Producto({
      nombre,
      categoria,
      precio: Number(precio),
      stock: Number(stock)
    });

    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error('Error POST /api/productos:', err);
    res.status(400).json({ error: 'Error al guardar: ' + err.message });
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
// ENDPOINTS API - USUARIOS
// ------------------------------------------------------------------
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
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

// Servir la página principal por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
