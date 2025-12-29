// src/controllers/producto.controller.js
const Producto = require('../models/producto.model');

const obtenerProductos = async (req, res) => {
    try {
        const listaProductos = await Producto.getAll();
        
        // Respondemos con un JSON y código 200 (Éxito)
        res.status(200).json({
            ok: true,
            datos: listaProductos
        });
    } catch (error) {
        console.error(error);
        // Si algo falla, código 500 (Error del servidor)
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los productos'
        });
    }
};

module.exports = { obtenerProductos };