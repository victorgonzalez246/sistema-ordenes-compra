import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { requisicionesApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { dinero, fecha, hoyISO } from '../utils/formato';
import { metricas } from '../services/metricas';

const columnas = [
  { clave: 'numero', titulo: 'Número', render: (r) => <strong className="sin-corte">{r.numero}</strong> },
  { clave: 'fecha', titulo: 'Fecha', render: (r) => fecha(r.fecha) },
  {
    clave: 'descripcion',
    titulo: 'Solicitud',
    render: (r) => (
      <>
        {r.descripcion}
        <div className="texto-suave">
          {r.empleado?.nombre} · {r.empleado?.departamento?.nombre}
        </div>
      </>
    ),
  },
  { clave: 'prioridad', titulo: 'Prioridad', render: (r) => <Insignia valor={r.prioridad} clase={`prioridad-${r.prioridad}`} /> },
  { clave: 'monto_estimado', titulo: 'Estimado', alinear: 'derecha', render: (r) => dinero(r.monto_estimado) },
  { clave: 'estado', titulo: 'Estado', render: (r) => <Insignia valor={r.estado} /> },
];

const Formulario = formularioDe([
  { nombre: 'numero', etiqueta: 'Número', tipo: 'texto', requerido: true, max: 30, placeholder: 'REQ-2026-0006' },
  { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { nombre: 'empleado_id', etiqueta: 'Solicitante', tipo: 'relacion', requerido: true, fuente: fuentes.empleado, ancho: 'completo' },
  { nombre: 'descripcion', etiqueta: 'Qué se necesita', tipo: 'area', requerido: true, max: 255, ancho: 'completo' },
  {
    nombre: 'prioridad',
    etiqueta: 'Prioridad',
    tipo: 'select',
    defecto: 'media',
    opciones: [
      { valor: 'baja', texto: 'Baja' },
      { valor: 'media', texto: 'Media' },
      { valor: 'alta', texto: 'Alta' },
    ],
  },
  { nombre: 'monto_estimado', etiqueta: 'Monto estimado (₡)', tipo: 'dinero' },
  {
    nombre: 'estado',
    etiqueta: 'Estado',
    tipo: 'select',
    soloEditar: true,
    ayuda: 'Una vez aprobada o rechazada ya no se puede modificar',
    opciones: [
      { valor: 'pendiente', texto: 'Pendiente' },
      { valor: 'aprobada', texto: 'Aprobada' },
      { valor: 'rechazada', texto: 'Rechazada' },
    ],
  },
]);

export default function RequisicionesPage() {
  return (
    <PaginaCatalogo
      titulo="Requisiciones"
      descripcion="Solicitudes internas de compra. Solo las pendientes se editan; las aprobadas no se eliminan."
      singular="Requisición"
      femenino
      api={requisicionesApi}
      metricas={metricas.requisiciones}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['numero', 'descripcion', 'estado', 'prioridad', (r) => r.empleado?.nombre]}
      nombreDe={(r) => r.numero}
    />
  );
}
