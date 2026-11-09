import PaginaCatalogo from '../components/PaginaCatalogo';
import EstadoOrden from '../components/EstadoOrden';
import RecepcionForm from '../components/RecepcionForm';
import { recepcionesApi } from '../services/recursos';
import { enlaceTrazabilidad } from '../services/inventario';
import { entero, fecha } from '../utils/formato';
import { metricas } from '../services/metricas';

const columnas = [
  { clave: 'fecha', titulo: 'Fecha', render: (r) => <span className="sin-corte">{fecha(r.fecha)}</span> },
  {
    clave: 'orden',
    titulo: 'Orden',
    render: (r) => (
      <span className="sin-corte">
        <strong>{r.orden?.numero}</strong> <EstadoOrden estado={r.orden?.estado} />
      </span>
    ),
  },
  { clave: 'bodega', titulo: 'Bodega', render: (r) => r.bodega?.nombre },
  {
    clave: 'materiales',
    titulo: 'Entró al inventario',
    render: (r) =>
      r.movimientos?.length ? (
        r.movimientos.map((m) => (
          <div key={m.id} className="sin-corte">
            <a href={enlaceTrazabilidad(m.producto?.id)}>{entero(m.cantidad)} {m.producto?.unidad}</a>{' '}
            <span className="texto-suave">{m.producto?.codigo}</span>
          </div>
        ))
      ) : (
        <span className="texto-suave">Sin entradas</span>
      ),
  },
  { clave: 'empleado', titulo: 'Recibió', render: (r) => r.empleado?.nombre },
  { clave: 'observaciones', titulo: 'Observaciones', render: (r) => r.observaciones || '—' },
];

export default function RecepcionesPage() {
  return (
    <PaginaCatalogo
      titulo="Recepciones"
      descripcion="Mercancía que llega a una bodega u obra. Lo recibido entra al inventario ligado a su orden de compra."
      singular="Recepción"
      femenino
      api={recepcionesApi}
      metricas={metricas.recepciones}
      columnas={columnas}
      Formulario={RecepcionForm}
      camposBusqueda={[(r) => r.orden?.numero, (r) => r.bodega?.nombre, (r) => r.empleado?.nombre, 'observaciones']}
      nombreDe={(r) => `recepción de ${r.orden?.numero} del ${fecha(r.fecha)}`}
    />
  );
}
