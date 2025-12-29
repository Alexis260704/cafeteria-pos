// server/src/controllers/venta.controller.js
const db = require('../config/db');

const crearVenta = async (req, res) => {
    // 1. Obtenemos una conexión exclusiva del pool
    const connection = await db.getConnection();
    
    try {
        // 👇 AGREGA ESTAS 3 LÍNEAS PARA ESPIAR 👇
        console.log("📦 DATOS RECIBIDOS EN EL BACKEND:");
        console.log(req.body); 
        console.log("--------------------------------");

        const { total, carrito } = req.body;

        // Validación de seguridad (Para que no explote si llega vacío)
        if (!carrito || !Array.isArray(carrito)) {
            throw new Error("El carrito llegó vacío o con el formato incorrecto");
        }

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

// server/src/controllers/venta.controller.js

// ... (mantén las importaciones y crearVenta igual)

const obtenerVentasHoy = async (req, res) => {
    try {
        // Esta consulta hace 3 cosas:
        // 1. Trae la hora y el total.
        // 2. USA GROUP_CONCAT: Junta "1x Cafe, 2x Waffle" en un solo texto.
        // 3. USA UNA SUB-CONSULTA (WHERE): Solo trae ventas hechas DESPUÉS del último cierre.
        
        const query = `
            SELECT 
                v.id, 
                DATE_FORMAT(v.fecha, '%h:%i %p') as hora, 
                v.total,
                GROUP_CONCAT(
                    CONCAT(dv.cantidad, 'x ', p.nombre) SEPARATOR ', '
                ) as descripcion
            FROM ventas v
            JOIN detalle_ventas dv ON v.id = dv.id_venta
            JOIN productos p ON dv.id_producto = p.id
            WHERE DATE(v.fecha) = CURDATE()
            AND v.fecha > (
                SELECT COALESCE(MAX(CONCAT(fecha, ' ', hora_cierre)), '2000-01-01 00:00:00') 
                FROM cierres_diarios
            )
            GROUP BY v.id 
            ORDER BY v.id DESC
        `;
        
        const [rows] = await db.query(query);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

// ... (mantén obtenerResumenDia, cerrarDia, etc. igual)
// Asegúrate de que obtenerVentasHoy siga en el module.exports al final

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

// Agrega esto ANTES del module.exports

const obtenerVentasPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params; // Recibimos la fecha (YYYY-MM-DD)

        const query = `
            SELECT 
                v.id, 
                DATE_FORMAT(v.fecha, '%h:%i %p') as hora, 
                v.total,
                GROUP_CONCAT(
                    CONCAT(dv.cantidad, 'x ', p.nombre) SEPARATOR ', '
                ) as descripcion
            FROM ventas v
            JOIN detalle_ventas dv ON v.id = dv.id_venta
            JOIN productos p ON dv.id_producto = p.id
            WHERE DATE(v.fecha) = ? 
            GROUP BY v.id 
            ORDER BY v.id DESC
        `;
        
        const [rows] = await db.query(query, [fecha]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

// ¡NO OLVIDES AGREGARLO AL EXPORT FINAL!
module.exports = {
    crearVenta,
    obtenerVentasHoy,
    obtenerResumenDia,
    cerrarDia,
    obtenerHistorialCierres,
    obtenerVentasPorFecha // <--- NUEVO
};