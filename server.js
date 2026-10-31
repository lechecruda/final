const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para entender JSON y servir archivos HTML estáticos
app.use(express.json());
app.use(express.static(__dirname));

// Cadena de conexión desde las Variables de Entorno de Azure
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado exitosamente a MongoDB en Azure'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));
} else {
  console.warn('Advertencia: No se encontró la variable MONGODB_URI');
}

// Servir la página principal por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ejemplo de endpoint de API para guardar o consultar datos en MongoDB
app.get('/api/test', async (req, res) => {
  res.json({ mensaje: 'Backend conectado con MongoDB correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});