const { Router } = require('express');
const router = Router();

// 👇 AQUÍ ES DONDE TIENES QUE AGREGARLO (dentro de las llaves)
const { 
    crearVenta, 
    obtenerResumenDia, 
    cerrarDia, 
    obtenerHistorialCierres,
    obtenerVentasHoy // <--- ¡Falta agregar esto aquí!
} = require('../controllers/venta.controller');

router.post('/', crearVenta);
router.get('/corte-dia', obtenerResumenDia);
router.post('/cerrar-dia', cerrarDia);
router.get('/historial', obtenerHistorialCierres);
router.get('/hoy', obtenerVentasHoy); // Ahora sí funcionará

module.exports = router;