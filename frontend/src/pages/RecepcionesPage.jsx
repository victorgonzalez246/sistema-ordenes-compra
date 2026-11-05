import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import EstadoOrden from '../components/EstadoOrden';
import { recepcionesApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { fecha, hoyISO } from '../utils/formato';
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
  { clave: 'empleado', titulo: 'Recibió', render: (r) => r.empleado?.nombre },
  { clave: 'observaciones', titulo: 'Observaciones', render: (r) => r.observaciones || '—' },
];

const Formulario = formularioDe([
  { nombre: 'orden_id', etiqueta: 'Orden de compra', tipo: 'relacion', requerido: true, fuente: fuentes.ordenAprobada, ancho: 'completo', ayuda: 'Solo órdenes aprobadas o recibidas' },
  { nombre: 'bodega_id', etiqueta: 'Bodega', tipo: 'relacion', requerido: true, fuente: fuentes.bodega },
  { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { nombre: 'empleado_id', etiqueta: 'Recibido por', tipo: 'relacion', requerido: true, fuente: fuentes.empleado, ancho: 'completo' },
  { nombre: 'observaciones', etiqueta: 'Observaciones', tipo: 'area', max: 255, ancho: 'completo' },
]);

export default function RecepcionesPage() {
  return (
    <PaginaCatalogo
      titulo="Recepciones"
      descripcion="Mercancía que llega a las bodegas. Solo se registra para órdenes aprobadas o ya recibidas."
      singular="Recepción"
      femenino
      api={recepcionesApi}
      metricas={metricas.recepciones}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={[(r) => r.orden?.numero, (r) => r.bodega?.nombre, (r) => r.empleado?.nombre, 'observaciones']}
      nombreDe={(r) => `recepción de ${r.orden?.numero} del ${fecha(r.fecha)}`}
    />
  );
}
