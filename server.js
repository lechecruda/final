const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGODB_URI;

// Configuración de conexión optimizada para Azure Cosmos DB / DocumentDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    dbName: 'Productos',
    tls: true,
    ssl: true,
    retryWrites: false,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log('✅ Conectado exitosamente a MongoDB en Azure'))
  .catch(err => console.error('❌ Error grave al conectar a MongoDB:', err));
} else {
  console.error('CRÍTICO: No se encontró la variable MONGODB_URI');
}

// Middleware de seguridad: Si la BD no está conectada, responde con error inmediato en lugar de congelar la página
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'La base de datos aún no está conectada o está rechazando las peticiones de Azure. Revisa las reglas de Redes/Firewall en Azure.' 
    });
  }
  next();
});
