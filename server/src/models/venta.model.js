const db = require('../config/db');

const Venta = {
    create: async (datosVenta) => {
        // datosVenta trae: { total: 50.00, items: [...] }
        
        // 1. Pedimos una conexión dedicada para la transacción
        const connection = await db.getConnection();

        try {
            // Iniciamos la transacción (Bloqueamos las tablas necesarias)
            await connection.beginTransaction();

            // PASO A: Insertar la cabecera de la venta
            const [resultVenta] = await connection.query(
                'INSERT INTO ventas (total) VALUES (?)', 
                [datosVenta.total]
            );
            const ventaId = resultVenta.insertId; // Obtenemos el ID generado (ej: Ticket #105)

            // PASO B: Preparar los productos para insertarlos en lote
            // Convertimos el array de objetos en un array de arrays para MySQL
            const detalles = datosVenta.items.map(item => [
                ventaId,          // ID de la venta
                item.id,          // ID del producto
                item.cantidad,    // Cuántos llevó
                item.precio       // Precio al momento de la venta
            ]);

            // Insertamos todos los detalles de una sola vez (Bulk Insert)
            await connection.query(
                'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ?',
                [detalles]
            );

            // Si llegamos aquí, todo salió bien. ¡GUARDAR CAMBIOS!
            await connection.commit();
            return ventaId;

        } catch (error) {
            // Si algo falló, deshacemos TODO lo que se hizo en este intento
            await connection.rollback();
            throw error;
        } finally {
            // Liberamos la conexión para que otro usuario la use
            connection.release();
        }
    }
};

module.exports = Venta;