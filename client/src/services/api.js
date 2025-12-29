const API_URL = 'http://localhost:3000/api';

export const getProducts = async () => {
    const res = await fetch(`${API_URL}/productos`);
    const data = await res.json();
    return data.datos || data; // Manejo seguro de la respuesta
};

export const createSale = async (venta) => {
    const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta)
    });
    return res.ok;
};