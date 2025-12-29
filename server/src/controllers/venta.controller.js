const Venta = require('../models/venta.model');

const crearVenta = async (req, res) => {
    try {
        // req.body es lo que nos envía el Frontend (JSON)
        const { total, items } = req.body;

        // Validación básica
        if (!items || items.length === 0) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: "No se puede registrar una venta vacía" 
            });
        }

        const ventaId = await Venta.create({ total, items });

        res.status(201).json({
            ok: true,
            mensaje: "Venta registrada con éxito",
            id_ticket: ventaId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: "Error interno al procesar la venta"
        });
    }
};
// ... código anterior ...

const obtenerResumenDia = async (req, res) => {
    try {
        // Consulta SQL experta: Suma el total de ventas donde la fecha coincida con HOY (CURDATE)
        const query = `
            SELECT 
                COUNT(*) as cantidad_ventas,
                IFNULL(SUM(total), 0) as total_dinero
            FROM ventas 
            WHERE DATE(fecha) = CURDATE()
        `;
        
        // Asumiendo que usas pool.promise() como te enseñé en db.js,
        // necesitamos importar 'db' al inicio si no está.
        // Si usas el modelo, mejor agrégalo ahí, pero para hacerlo rápido lo haré directo aquí 
        // o mejor, reutilicemos la conexión del modelo si es posible.
        
        // FORMA SENCILLA (Directa):
        const db = require('../config/db'); 
        const [rows] = await db.query(query);

        res.json({
            ok: true,
            resumen: rows[0],
            fecha: new Date().toLocaleDateString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: "Error al sacar el corte" });
    }
};

// ... (código anterior)

// GUARDAR EL CIERRE EN LA BASE DE DATOS
const cerrarDia = async (req, res) => {
    const db = require('../config/db');
    try {
        // 1. Calculamos los datos del día actual
        const queryCalculo = `
            SELECT COUNT(*) as cantidad, IFNULL(SUM(total), 0) as dinero
            FROM ventas WHERE DATE(fecha) = CURDATE()
        `;
        const [rowsCalc] = await db.query(queryCalculo);
        const { cantidad, dinero } = rowsCalc[0];

        // 2. Guardamos en la tabla histórica
        const queryInsert = `
            INSERT INTO cierres_diarios (fecha, hora_cierre, total_ventas, total_dinero)
            VALUES (CURDATE(), CURTIME(), ?, ?)
        `;
        await db.query(queryInsert, [cantidad, dinero]);

        res.json({ ok: true, mensaje: "Día cerrado y guardado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: "Error al cerrar caja" });
    }
};

// OBTENER LA LISTA DE TODOS LOS CIERRES PASADOS
const obtenerHistorialCierres = async (req, res) => {
    const db = require('../config/db');
    try {
        const [rows] = await db.query('SELECT * FROM cierres_diarios ORDER BY fecha DESC, hora_cierre DESC');
        res.json({ ok: true, datos: rows });
    } catch (error) {
        res.status(500).json({ ok: false });
    }
};

// ... al final, antes del module.exports

// NUEVO: Obtener el detalle de ventas DE HOY (para el log)
const obtenerVentasHoy = async (req, res) => {
    const db = require('../config/db');
    try {
        // Esta consulta trae la hora, el id del ticket y el total
        const query = `
            SELECT id, DATE_FORMAT(fecha, '%h:%i %p') as hora, total 
            FROM ventas 
            WHERE DATE(fecha) = CURDATE() 
            ORDER BY id DESC
        `;
        const [ventas] = await db.query(query);

        // (Opcional) Si quisieras los productos de cada venta, sería una consulta más compleja,
        // pero para un resumen rápido, hora y total suelen bastar. 
        // Si necesitas ver qué productos eran, avísame y ajustamos.
        
        res.json({ ok: true, datos: ventas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: "Error al leer ventas" });
    }
};

// ¡No olvides agregarlo al export final!
module.exports = { 
    crearVenta, 
    obtenerResumenDia, 
    cerrarDia, 
    obtenerHistorialCierres,
    obtenerVentasHoy // <--- AGREGADO
};