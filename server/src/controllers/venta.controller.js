// server/src/controllers/venta.controller.js
const db = require('../config/db');

const crearVenta = async (req, res) => {
    // 1. Obtenemos una conexión exclusiva del pool
    const connection = await db.getConnection();

    try {
        const { total, carrito } = req.body;

        // 2. Iniciamos la transacción (Modo "Todo o Nada")
        await connection.beginTransaction();

        // 3. Insertamos la VENTA general
        const [ventaResult] = await connection.query(
            'INSERT INTO ventas (total) VALUES (?)',
            [total]
        );
        const idVenta = ventaResult.insertId;

        // 4. Insertamos cada PRODUCTO del carrito
        // Preparamos los datos para insertarlos de golpe (más rápido)
        const detalles = carrito.map(producto => [
            idVenta,
            producto.id,
            1, // Cantidad (asumimos 1 por ahora según tu lógica frontend)
            producto.precio
        ]);

        await connection.query(
            'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES ?',
            [detalles]
        );

        // 5. Si todo salió bien, GUARDAMOS permanentemente
        await connection.commit();
        
        console.log(`✅ Venta #${idVenta} registrada con éxito`);
        res.json({ ok: true, id_venta: idVenta, mensaje: 'Venta registrada' });

    } catch (error) {
        // 6. Si algo falló, DESHACEMOS todo (Rollback)
        await connection.rollback();
        console.error("🔴 ERROR CRÍTICO AL CREAR VENTA:", error);
        
        // Enviamos el error al frontend para saber qué pasó
        res.status(500).json({ 
            ok: false, 
            mensaje: 'Error al registrar venta', 
            error: error.message 
        });

    } finally {
        // 7. SIEMPRE liberamos la conexión (Vital en la nube)
        connection.release();
    }
};

// --- OTRAS FUNCIONES (Las dejamos igual, pero asegurándonos de exportarlas) ---

const obtenerVentasHoy = async (req, res) => {
    try {
        // TIME_FORMAT y DATE_FORMAT para que se vea bonito en Perú
        const [rows] = await db.query(`
            SELECT id, DATE_FORMAT(fecha, '%h:%i %p') as hora, total 
            FROM ventas 
            WHERE DATE(fecha) = CURDATE() 
            ORDER BY id DESC
        `);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

const obtenerResumenDia = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as cantidad_ventas,
                COALESCE(SUM(total), 0) as total_dinero
            FROM ventas 
            WHERE DATE(fecha) = CURDATE()
        `);
        res.json({ ok: true, resumen: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false });
    }
};

const cerrarDia = async (req, res) => {
    try {
        // 1. Calculamos totales
        const [resumen] = await db.query(`
            SELECT COUNT(*) as cant, COALESCE(SUM(total), 0) as tot 
            FROM ventas WHERE DATE(fecha) = CURDATE()
        `);
        
        // 2. Guardamos en historial
        await db.query(`
            INSERT INTO cierres_diarios (fecha, hora_cierre, total_ventas, total_dinero)
            VALUES (CURDATE(), CURTIME(), ?, ?)
        `, [resumen[0].cant, resumen[0].tot]);

        res.json({ ok: true, mensaje: "Cierre guardado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

const obtenerHistorialCierres = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cierres_diarios ORDER BY fecha DESC LIMIT 30');
        res.json({ ok: true, datos: rows });
    } catch (error) {
        res.status(500).json({ ok: false });
    }
};

module.exports = {
    crearVenta,
    obtenerVentasHoy,
    obtenerResumenDia,
    cerrarDia,
    obtenerHistorialCierres
};