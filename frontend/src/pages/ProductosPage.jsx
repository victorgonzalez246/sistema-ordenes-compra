import PaginaCatalogo from '../components/PaginaCatalogo';
import ProductoForm from '../components/ProductoForm';
import { productosApi } from '../services/recursos';
import { dinero } from '../utils/formato';

const columnas = [
  { clave: 'codigo', titulo: 'Código', render: (p) => <code>{p.codigo}</code> },
  { clave: 'nombre', titulo: 'Producto', render: (p) => <strong>{p.nombre}</strong> },
  { clave: 'categoria', titulo: 'Categoría', render: (p) => p.categoria?.nombre || '—' },
  { clave: 'unidad', titulo: 'Unidad' },
  { clave: 'precio_ref', titulo: 'Precio ref.', alinear: 'derecha', render: (p) => dinero(p.precio_ref) },
];

const busqueda = ['codigo', 'nombre', 'unidad', (p) => p.categoria?.nombre];

export default function ProductosPage() {
  return (
    <PaginaCatalogo
      titulo="Productos"
      descripcion="Catálogo de bienes que se compran, con su unidad y precio de referencia."
      singular="Producto"
      api={productosApi}
      columnas={columnas}
      Formulario={ProductoForm}
      camposBusqueda={busqueda}
      nombreDe={(p) => `${p.codigo} · ${p.nombre}`}
    />
  );
}
