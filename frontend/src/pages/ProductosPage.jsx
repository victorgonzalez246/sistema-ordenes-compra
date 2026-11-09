import PaginaCatalogo from '../components/PaginaCatalogo';
import ProductoForm from '../components/ProductoForm';
import { productosApi } from '../services/recursos';
import { enlaceTrazabilidad } from '../services/inventario';
import { dinero, entero } from '../utils/formato';
import { metricas } from '../services/metricas';

const numero = (n) => (n === null || n === undefined ? '—' : entero(n));

const columnas = [
  { clave: 'codigo', titulo: 'Código', render: (p) => <code className="sin-corte">{p.codigo}</code> },
  {
    clave: 'nombre',
    titulo: 'Producto',
    render: (p) => (
      <div className="celda-material">
        <a href={enlaceTrazabilidad(p.id)} title="Ver trazabilidad">
          <strong>{p.nombre}</strong>
        </a>
        <div className="texto-suave">{p.categoria?.nombre || 'Sin categoría'}</div>
      </div>
    ),
  },
  {
    clave: 'precio_ref',
    titulo: 'Precio ref.',
    alinear: 'derecha',
    render: (p) => (
      <>
        {dinero(p.precio_ref)}
        <div className="texto-suave">por {p.unidad}</div>
      </>
    ),
  },
  {
    clave: 'demanda',
    titulo: 'Demanda/día',
    alinear: 'derecha',
    render: (p) =>
      p.demanda_promedio === null ? (
        '—'
      ) : (
        <>
          {numero(p.demanda_promedio)} <span className="texto-suave">(máx. {numero(p.demanda_maxima ?? p.demanda_promedio)})</span>
          <div className="texto-suave">entrega {p.tiempo_entrega ?? '—'} d</div>
        </>
      ),
  },
  {
    clave: 'punto_reorden',
    titulo: 'Punto reorden',
    alinear: 'derecha',
    render: (p) => (
      <>
        <strong>{numero(p.punto_reorden)}</strong>
        <div className="texto-suave">SS {numero(p.stock_seguridad)}</div>
      </>
    ),
  },
];

const busqueda = ['codigo', 'nombre', 'unidad', (p) => p.categoria?.nombre];

export default function ProductosPage() {
  return (
    <PaginaCatalogo
      titulo="Productos"
      descripcion="Catálogo de materiales con sus parámetros de inventario. El stock de seguridad y el punto de reorden se calculan solos."
      singular="Producto"
      api={productosApi}
      metricas={metricas.productos}
      columnas={columnas}
      Formulario={ProductoForm}
      camposBusqueda={busqueda}
      nombreDe={(p) => `${p.codigo} · ${p.nombre}`}
    />
  );
}
