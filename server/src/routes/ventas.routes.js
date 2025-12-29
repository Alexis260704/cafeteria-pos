const { Router } = require('express');
const router = Router();

// 👇 AQUÍ ES DONDE FALTABA AGREGARLO
const { 
    crearVenta, 
    obtenerVentasHoy, 
    obtenerResumenDia, 
    cerrarDia, 
    obtenerHistorialCierres,
    obtenerVentasPorFecha // <--- ¡IMPORTANTE: Agrega esta línea!
} = require('../controllers/venta.controller');

router.post('/', crearVenta);
router.get('/hoy', obtenerVentasHoy);
router.get('/corte-dia', obtenerResumenDia);
router.post('/cerrar-dia', cerrarDia);
router.get('/historial', obtenerHistorialCierres);

// Esta es la nueva ruta que agregamos
router.get('/fecha/:fecha', obtenerVentasPorFecha);

module.exports = router;