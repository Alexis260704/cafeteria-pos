// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ---> AQUÍ AGREGAMOS LA RUTA <---
// Todo lo que venga de productos.routes se usará bajo el prefijo /api/productos
app.use('/api/productos', require('./routes/productos.routes')); 
app.use('/api/ventas', require('./routes/ventas.routes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});