// src/routes/productos.routes.js
const { Router } = require('express');
const router = Router();
const { obtenerProductos } = require('../controllers/producto.controller');

// Definimos la ruta GET raíz (que será /api/productos)
router.get('/', obtenerProductos);

module.exports = router;