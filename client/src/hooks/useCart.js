import { useState, useEffect } from 'react';
import { createSale } from '../services/api';

export const useCart = () => {
  // 1. AL INICIAR: Intentamos leer del localStorage
  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem('carrito_pos');
    return guardado ? JSON.parse(guardado) : [];
  });

  // 2. CADA VEZ QUE CAMBIA: Guardamos en localStorage
  useEffect(() => {
    localStorage.setItem('carrito_pos', JSON.stringify(carrito));
  }, [carrito]);

  const agregarProducto = (producto) => {
    setCarrito([...carrito, { ...producto, _uid: Date.now() + Math.random() }]);
  };

  const eliminarProducto = (indexToDelete) => {
    setCarrito(carrito.filter((_, index) => index !== indexToDelete));
  };

  const limpiarCarrito = () => setCarrito([]);

  const total = carrito.reduce((sum, item) => sum + parseFloat(item.precio), 0);

  const enviarVenta = async () => {
    if (carrito.length === 0) return false;
    
    // AQUÍ ESTABA EL ERROR:
    // Antes decías "items:", pero el backend espera "carrito:"
    const venta = {
        total: total,
        carrito: carrito.map(p => ({ id: p.id, precio: p.precio, cantidad: 1 })) 
    };

    const exito = await createSale(venta);
    if (exito) limpiarCarrito();
    return exito;
  };

  return { carrito, total, agregarProducto, eliminarProducto, limpiarCarrito, enviarVenta };
};