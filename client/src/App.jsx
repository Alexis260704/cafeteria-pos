import { useState, useEffect } from 'react';
import { getProducts, getVentasHoy, getCorteDia, getHistorial, cerrarDiaDB, getVentasPorFecha } from './services/api';
import { useCart } from './hooks/useCart';
import { formatCurrency } from './utils/format';
import logoImg from './assets/logo.png';

function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  
  // Vistas: CATALOGO, MENU, MOVIMIENTOS, CORTE, HISTORIAL, DETALLE_HISTORIAL, TICKET
  const [vista, setVista] = useState('CATALOGO'); 
  
  const [movimientosHoy, setMovimientosHoy] = useState([]);
  const [datosCorte, setDatosCorte] = useState(null);
  const [listaHistorial, setListaHistorial] = useState([]);
  
  // NUEVO: Para manejar el historial profundo
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null); // Qué día estamos viendo
  const [ventasDeFecha, setVentasDeFecha] = useState([]); // Los tickets de ese día
  
  // NUEVO: Para el efecto "Acordeón" (Click -> Ver detalle)
  const [ticketExpandido, setTicketExpandido] = useState(null);

  const { carrito, total, agregarProducto, eliminarProducto, limpiarCarrito, enviarVenta } = useCart();

  useEffect(() => {
    getProducts().then(data => {
      setProductos(data);
      setCargando(false);
    });
  }, []);

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const productosFiltrados = categoriaActiva === "Todos" ? productos : productos.filter(p => p.categoria === categoriaActiva);

  // --- ACCIONES ---

  const handleCobrar = async () => {
    if(!window.confirm(`¿Cobrar ${formatCurrency(total)}?`)) return;
    const exito = await enviarVenta();
    if (exito) {
        setVista('CATALOGO');
        alert("✅ Venta registrada");
    } else {
        alert("❌ Error al registrar venta.");
    }
  };

  const toggleTicket = (id) => {
    if (ticketExpandido === id) {
        setTicketExpandido(null); // Si ya estaba abierto, lo cierro
    } else {
        setTicketExpandido(id); // Abro el nuevo
    }
  };

  const cargarMovimientos = async () => {
    const data = await getVentasHoy();
    setMovimientosHoy(data.datos || []);
    setVista('MOVIMIENTOS');
  };

  const cargarCorte = async () => {
    const data = await getCorteDia();
    setDatosCorte(data.resumen);
    setVista('CORTE');
  };

  const cargarHistorial = async () => {
    const data = await getHistorial();
    setListaHistorial(data.datos || []);
    setVista('HISTORIAL');
  };

  // NUEVO: Al hacer click en una fecha del historial
  const verDetalleFecha = async (fecha) => {
    // Formateamos la fecha para que sea YYYY-MM-DD
    const fechaStr = new Date(fecha).toISOString().split('T')[0];
    const data = await getVentasPorFecha(fechaStr);
    
    setFechaSeleccionada(fechaStr);
    setVentasDeFecha(data.datos || []);
    setVista('DETALLE_HISTORIAL');
  };

  const cerrarDiaDefinitivo = async () => {
    if (!window.confirm("⚠️ ¿CERRAR CAJA?\nSe bloqueará el registro de ventas por hoy.")) return;
    await cerrarDiaDB();
    alert("🌙 Caja cerrada. ¡Hasta mañana!");
    window.location.reload();
  };

  // --- VISTAS ---

  if (vista === 'MENU') {
    return (
        <div className="h-screen bg-amber-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-amber-900">Menú Admin</h2>
                <button onClick={() => setVista('CATALOGO')} className="text-4xl text-amber-800">×</button>
            </div>
            <div className="grid gap-4">
                {[
                    { icono: "📋", titulo: "Movimientos de Hoy", subtitulo: "Ver ventas activas", accion: cargarMovimientos },
                    { icono: "📊", titulo: "Corte de Caja", subtitulo: "Resumen y cierre", accion: cargarCorte },
                    { icono: "📚", titulo: "Historial de Cierres", subtitulo: "Consultar días pasados", accion: cargarHistorial }
                ].map((item, idx) => (
                    <button key={idx} onClick={item.accion} 
                        className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4 active:scale-95 transition">
                        <span className="text-3xl">{item.icono}</span>
                        <div>
                            <p className="font-bold text-lg text-amber-900">{item.titulo}</p>
                            <p className="text-sm text-amber-600">{item.subtitulo}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  // VISTA: VENTAS DE HOY (Con acordeón)
  if (vista === 'MOVIMIENTOS') {
    return (
        <div className="h-screen bg-amber-50 flex flex-col">
            <div className="p-4 border-b border-amber-200 flex items-center bg-white shadow-sm">
                <button onClick={() => setVista('MENU')} className="text-2xl mr-4 text-amber-800">←</button>
                <h2 className="text-xl font-bold text-amber-900">Ventas de Hoy</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {movimientosHoy.length === 0 ? <p className="text-center mt-10 text-amber-800/50">Sin ventas nuevas.</p> : 
                 movimientosHoy.map((v) => (
                    <button 
                        key={v.id} 
                        onClick={() => toggleTicket(v.id)}
                        className="w-full bg-white border-b border-amber-200 p-4 text-left transition-all active:bg-amber-50"
                    >
                        {/* Cabecera del Ticket */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-amber-900 mr-2">#{v.id}</span>
                                <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{v.hora}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-700 text-lg">{formatCurrency(v.total)}</span>
                                <span className="text-amber-400 text-xs">{ticketExpandido === v.id ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {/* Detalle Desplegable (Solo si está expandido) */}
                        {ticketExpandido === v.id && (
                            <div className="mt-3 pt-3 border-t border-amber-100 animate-fade-in text-sm text-stone-600">
                                <p className="font-semibold text-amber-800 mb-1">Detalle:</p>
                                {v.descripcion.split(', ').map((item, i) => (
                                    <p key={i} className="pl-2 border-l-2 border-amber-200 mb-1">{item}</p>
                                ))}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  // VISTA: HISTORIAL (Lista de días)
  if (vista === 'HISTORIAL') {
      return (
        <div className="h-screen bg-amber-50 flex flex-col">
            <div className="p-4 border-b border-amber-200 flex items-center bg-white shadow-sm">
                <button onClick={() => setVista('MENU')} className="text-2xl mr-4 text-amber-800">←</button>
                <h2 className="text-xl font-bold text-amber-900">Historial</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {listaHistorial.length === 0 ? <p className="text-center mt-10 text-amber-800/50">Vacío.</p> : 
                    listaHistorial.map((cierre) => (
                        <button 
                            key={cierre.id} 
                            onClick={() => verDetalleFecha(cierre.fecha)}
                            className="w-full bg-white border border-amber-100 p-4 rounded-xl shadow-sm flex justify-between items-center active:scale-95 transition"
                        >
                            <div className="text-left">
                                <p className="font-bold text-amber-900 text-lg">
                                    {new Date(cierre.fecha).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-amber-600">Cierre: {cierre.hora_cierre.substring(0, 5)}</p>
                                <p className="text-xs text-stone-400">{cierre.total_ventas} tickets</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-amber-700 text-xl">
                                    {formatCurrency(cierre.total_dinero)}
                                </span>
                                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Ver detalle →</span>
                            </div>
                        </button>
                    ))
                }
            </div>
        </div>
      );
  }

  // VISTA NUEVA: DETALLE DE UN DÍA PASADO (Igual a Movimientos, pero de otra fecha)
  if (vista === 'DETALLE_HISTORIAL') {
    return (
        <div className="h-screen bg-amber-50 flex flex-col">
            <div className="p-4 border-b border-amber-200 flex items-center bg-white shadow-sm">
                <button onClick={() => setVista('HISTORIAL')} className="text-2xl mr-4 text-amber-800">←</button>
                <div>
                    <h2 className="text-xl font-bold text-amber-900">Ventas del Día</h2>
                    <p className="text-xs text-amber-600">{fechaSeleccionada}</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {ventasDeFecha.map((v) => (
                    <button 
                        key={v.id} 
                        onClick={() => toggleTicket(v.id)}
                        className="w-full bg-white border-b border-amber-200 p-4 text-left transition-all active:bg-amber-50 mb-1 rounded-lg"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-amber-900 mr-2">#{v.id}</span>
                                <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{v.hora}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-700 text-lg">{formatCurrency(v.total)}</span>
                                <span className="text-amber-400 text-xs">{ticketExpandido === v.id ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {ticketExpandido === v.id && (
                            <div className="mt-3 pt-3 border-t border-amber-100 animate-fade-in text-sm text-stone-600">
                                {v.descripcion.split(', ').map((item, i) => (
                                    <p key={i} className="pl-2 border-l-2 border-amber-200 mb-1">{item}</p>
                                ))}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  // VISTA: CORTE
  if (vista === 'CORTE') {
      return (
        <div className="h-screen bg-amber-950 text-white flex flex-col p-6 justify-center text-center">
            <div className="mb-8"><span className="text-4xl">☕</span></div>
            <h2 className="text-3xl font-bold mb-2 text-amber-50">Resumen del Día</h2>
            <p className="text-amber-300/60 mb-8">{new Date().toLocaleDateString()}</p>
            <div className="bg-amber-900/50 p-6 rounded-2xl mb-8 border border-amber-800">
                <p className="text-amber-200/60 mb-2 uppercase text-xs tracking-widest">Total Recaudado</p>
                <p className="text-5xl font-bold text-white">{formatCurrency(datosCorte?.total_dinero || 0)}</p>
                <p className="mt-4 text-sm text-amber-300">{datosCorte?.cantidad_ventas || 0} tickets emitidos</p>
            </div>
            <button onClick={cerrarDiaDefinitivo} className="bg-red-800 hover:bg-red-900 w-full py-4 rounded-xl font-bold text-lg mb-4 text-red-100 transition shadow-lg">🔒 CERRAR DÍA</button>
            <button onClick={() => setVista('MENU')} className="text-amber-400 underline hover:text-amber-200 transition">Volver</button>
        </div>
      );
  }

  // VISTA: TICKET
  if (vista === 'TICKET') {
    return (
      <div className="h-screen bg-amber-50 flex flex-col">
        <div className="p-4 border-b border-amber-200 flex items-center bg-white shadow-sm">
          <button onClick={() => setVista('CATALOGO')} className="text-2xl mr-4 text-amber-800">←</button>
          <h2 className="text-xl font-bold text-amber-900">Orden Actual</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
            {carrito.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-4 border-b border-amber-200/50 bg-white p-3 rounded-lg mb-2 shadow-sm">
                    <div>
                        <p className="font-medium text-amber-900">{item.nombre}</p>
                        <p className="text-sm text-amber-600">{formatCurrency(item.precio)}</p>
                    </div>
                    <button onClick={() => eliminarProducto(index)} className="text-red-400 hover:text-red-600 font-bold px-3 py-2">✕</button>
                </div>
            ))}
        </div>
        <div className="p-6 bg-white border-t border-amber-200 shadow-upper">
            <div className="flex justify-between mb-6 text-2xl font-bold text-amber-900">
                <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
            <button onClick={handleCobrar} className="w-full bg-amber-900 hover:bg-amber-950 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition">COBRAR</button>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL: CATALOGO
  return (
    <div className="h-screen bg-amber-50/50 flex flex-col relative overflow-hidden">
      <div className="bg-white px-4 pt-2 pb-2 shadow-sm z-10 sticky top-0 border-b border-amber-100/50">
        <div className="flex justify-between items-center mb-3 relative h-16">
            <div className="absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center w-full">
                <img src={logoImg} alt="Café Cultura Logo" className="h-16 object-contain drop-shadow-sm mix-blend-multiply" />
            </div>
            <button onClick={() => setVista('MENU')} className="ml-auto relative z-20 p-2 bg-amber-50 rounded-xl text-amber-900 hover:bg-amber-100 transition border border-amber-100 shadow-sm">⚙️</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm
                  ${categoriaActiva === cat ? 'bg-amber-900 text-white border-amber-900 transform scale-105' : 'bg-white text-amber-900 border-amber-100 hover:bg-amber-50'}`}>
                {cat}
              </button>
            ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-28">
          {cargando ? <p className="text-center mt-10 text-amber-800 animate-pulse">Preparando...</p> : (
            <div className="grid grid-cols-2 gap-4">
              {productosFiltrados.map((prod) => (
                <button key={prod.id} onClick={() => agregarProducto(prod)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 active:border-amber-500 active:ring-2 active:ring-amber-200 transition-all text-left h-36 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 rounded-full opacity-50 group-hover:bg-amber-100 transition-colors"></div>
                    <span className="font-bold text-stone-700 line-clamp-3 text-sm leading-snug relative z-10 group-active:text-amber-900">{prod.nombre}</span>
                    <div className="flex justify-between items-end relative z-10">
                        <span className="text-xs text-stone-400 font-medium">{prod.categoria}</span>
                        <span className="text-amber-800 font-black text-lg bg-amber-50/80 px-2 py-1 rounded-lg">{formatCurrency(prod.precio)}</span>
                    </div>
                </button>
              ))}
            </div>
          )}
      </div>
      {carrito.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 animate-bounce-small z-50">
            <button onClick={() => setVista('TICKET')} className="w-full bg-amber-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center border border-amber-700 backdrop-blur-md bg-opacity-95">
                <div className="flex items-center gap-3">
                    <span className="bg-white text-amber-900 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-inner">{carrito.length}</span>
                    <span className="font-semibold text-amber-50">Ver mi Orden</span>
                </div>
                <span className="font-bold text-xl text-white">{formatCurrency(total)}</span>
            </button>
        </div>
      )}
    </div>
  );
}

export default App;