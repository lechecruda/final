const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGODB_URI;

// Middleware para asegurar que la conexión esté activa antes de procesar guardar/consultar
async function conectarBD(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    try {
      if (MONGO_URI) {
        await mongoose.connect(MONGO_URI, {
          dbName: 'Productos',
          serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Conexión establecida con Azure MongoDB');
      } else {
        return res.status(500).json({ error: 'Falta la variable MONGODB_URI en Azure' });
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err.message);
      return res.status(500).json({ error: 'No se pudo conectar a MongoDB: ' + err.message });
    }
  }
  next();
}

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

// Rutas de API con middleware de conexión previa
app.get('/api/productos', conectarBD, async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/productos', conectarBD, async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;
    const nuevoProducto = new Producto({
      nombre,
      categoria,
      precio: Number(precio),
      stock: Number(stock)
    });
    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/productos/:id', conectarBD, async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/productos/:id', conectarBD, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/usuarios', conectarBD, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', conectarBD, async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    const guardado = await nuevoUsuario.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', conectarBD, async (req, res) => {
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
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
