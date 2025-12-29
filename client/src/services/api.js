// TU URL DE RENDER (Asegúrate que sea esta):
const API_URL = 'https://cafeteria-api-syy3.onrender.com/api';

export const getProducts = async () => {
    try {
        const res = await fetch(`${API_URL}/productos`);
        const data = await res.json();
        return data.datos || data;
    } catch (error) {
        console.error("Error cargando productos:", error);
        return [];
    }
};

export const createSale = async (venta) => {
    try {
        const res = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });
        return res.ok;
    } catch (error) {
        console.error("Error creando venta:", error);
        return false;
    }
};

// --- NUEVAS FUNCIONES (Para que no busquen en localhost) ---

export const getVentasHoy = async () => {
    try {
        const res = await fetch(`${API_URL}/ventas/hoy`);
        return await res.json();
    } catch (error) {
        console.error("Error obteniendo ventas hoy:", error);
        return { ok: false, datos: [] };
    }
};

export const getCorteDia = async () => {
    try {
        const res = await fetch(`${API_URL}/ventas/corte-dia`);
        return await res.json();
    } catch (error) {
        return { ok: false, resumen: null };
    }
};

export const getHistorial = async () => {
    try {
        const res = await fetch(`${API_URL}/ventas/historial`);
        return await res.json();
    } catch (error) {
        return { ok: false, datos: [] };
    }
};

export const cerrarDiaDB = async () => {
    try {
        await fetch(`${API_URL}/ventas/cerrar-dia`, { method: 'POST' });
        return true;
    } catch (error) {
        return false;
    }
};
export const getVentasPorFecha = async (fechaString) => {
    try {
        // fechaString debe ser YYYY-MM-DD
        const res = await fetch(`${API_URL}/ventas/fecha/${fechaString}`);
        return await res.json();
    } catch (error) {
        console.error("Error cargando detalle fecha:", error);
        return { ok: false, datos: [] };
    }
};