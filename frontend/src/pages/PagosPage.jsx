import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { pagosApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { dinero, fecha, hoyISO } from '../utils/formato';
import { metricas } from '../services/metricas';

const columnas = [
  { clave: 'fecha', titulo: 'Fecha', render: (p) => <span className="sin-corte">{fecha(p.fecha)}</span> },
  {
    clave: 'factura',
    titulo: 'Factura',
    render: (p) => (
      <span className="sin-corte">
        <strong>{p.factura?.numero}</strong> <Insignia valor={p.factura?.estado} />
      </span>
    ),
  },
  { clave: 'metodo_pago', titulo: 'Método', render: (p) => p.metodo_pago?.nombre },
  { clave: 'referencia', titulo: 'Referencia', render: (p) => (p.referencia ? <code>{p.referencia}</code> : '—') },
  { clave: 'monto', titulo: 'Monto', alinear: 'derecha', render: (p) => <strong>{dinero(p.monto)}</strong> },
];

const Formulario = formularioDe([
  { nombre: 'factura_id', etiqueta: 'Factura', tipo: 'relacion', requerido: true, fuente: fuentes.facturaPendiente, ancho: 'completo', ayuda: 'Solo facturas con saldo pendiente' },
  { nombre: 'monto', etiqueta: 'Monto (₡)', tipo: 'dinero', requerido: true, min: 0.01 },
  { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { nombre: 'metodo_pago_id', etiqueta: 'Método de pago', tipo: 'relacion', requerido: true, fuente: fuentes.metodoPago },
  { nombre: 'referencia', etiqueta: 'Referencia', tipo: 'texto', max: 60, placeholder: 'TRF-000000' },
]);

export default function PagosPage() {
  return (
    <PaginaCatalogo
      titulo="Pagos"
      descripcion="Pagos a proveedores. Un pago no puede superar el saldo de la factura y al cubrirlo la marca como pagada."
      singular="Pago"
      api={pagosApi}
      metricas={metricas.pagos}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['referencia', (p) => p.factura?.numero, (p) => p.metodo_pago?.nombre]}
      nombreDe={(p) => `pago de ${dinero(p.monto)} a ${p.factura?.numero}`}
    />
  );
}
