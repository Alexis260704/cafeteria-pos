// src/models/producto.model.js
const db = require('../config/db'); // Importamos la conexión

const Producto = {
    // Método para obtener todo el catálogo
    getAll: async () => {
        // Usamos try/catch para manejo de errores profesional
        try {
            const query = 'SELECT * FROM productos';
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Producto;