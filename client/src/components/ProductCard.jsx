import { formatCurrency } from '../utils/format';

export const ProductCard = ({ producto, onAdd }) => {
  return (
    <button
      onClick={() => onAdd(producto)}
      className="h-32 bg-white rounded-2xl shadow-sm border border-gray-200 
                 hover:shadow-md hover:border-orange-500 active:scale-95 transition-all
                 flex flex-col items-center justify-center gap-2 group"
    >
      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
        {producto.nombre.charAt(0)}
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-700">{producto.nombre}</p>
        <p className="text-orange-600 font-semibold">{formatCurrency(producto.precio)}</p>
      </div>
    </button>
  );
};