import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { facturasApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { dinero, fecha, hoyISO } from '../utils/formato';
import { metricas } from '../services/metricas';

const vencida = (f) => f.estado === 'pendiente' && f.fecha_vencimiento < hoyISO();

const columnas = [
  {
    clave: 'numero',
    titulo: 'Factura',
    render: (f) => (
      <>
        <strong className="sin-corte">{f.numero}</strong>
        <div className="texto-suave">{f.orden?.proveedor?.razon_social}</div>
      </>
    ),
  },
  { clave: 'orden', titulo: 'Orden', render: (f) => <span className="sin-corte">{f.orden?.numero}</span> },
  {
    clave: 'fecha_vencimiento',
    titulo: 'Vence',
    render: (f) => (
      <span className="sin-corte">
        {fecha(f.fecha_vencimiento)} {vencida(f) && <Insignia texto="Vencida" clase="estado-rechazada" />}
      </span>
    ),
  },
  { clave: 'monto', titulo: 'Monto', alinear: 'derecha', render: (f) => dinero(f.monto) },
  { clave: 'saldo', titulo: 'Saldo', alinear: 'derecha', render: (f) => (f.estado === 'anulada' ? '—' : dinero(f.monto - f.pagado)) },
  { clave: 'estado', titulo: 'Estado', render: (f) => <Insignia valor={f.estado} /> },
];

const Formulario = formularioDe([
  { nombre: 'numero', etiqueta: 'Número de factura', tipo: 'texto', requerido: true, max: 30 },
  { nombre: 'monto', etiqueta: 'Monto (₡)', tipo: 'dinero', requerido: true, min: 0.01 },
  { nombre: 'orden_id', etiqueta: 'Orden de compra', tipo: 'relacion', requerido: true, fuente: fuentes.ordenAprobada, ancho: 'completo', ayuda: 'Lo facturado no puede superar el total de la orden' },
  { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { nombre: 'fecha_vencimiento', etiqueta: 'Vencimiento', tipo: 'fecha', requerido: true },
  {
    nombre: 'estado',
    etiqueta: 'Estado',
    tipo: 'select',
    soloEditar: true,
    ayuda: '“Pagada” se asigna sola cuando los pagos cubren el monto',
    opciones: [
      { valor: 'pendiente', texto: 'Pendiente' },
      { valor: 'pagada', texto: 'Pagada', deshabilitado: true },
      { valor: 'anulada', texto: 'Anulada' },
    ],
  },
]);

export default function FacturasPage() {
  return (
    <PaginaCatalogo
      titulo="Facturas de proveedor"
      descripcion="Cuentas por pagar. El saldo baja con cada pago; una factura con pagos no se anula ni se elimina."
      singular="Factura"
      femenino
      api={facturasApi}
      metricas={metricas.facturas}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['numero', 'estado', (f) => f.orden?.numero, (f) => f.orden?.proveedor?.razon_social]}
      nombreDe={(f) => f.numero}
    />
  );
}
