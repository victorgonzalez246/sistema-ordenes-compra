import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { cotizacionesApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { dinero, fecha, hoyISO } from '../utils/formato';
import { metricas } from '../services/metricas';

const columnas = [
  {
    clave: 'producto',
    titulo: 'Producto',
    render: (c) => (
      <>
        <strong>{c.producto?.nombre}</strong>
        <div className="texto-suave"><code>{c.producto?.codigo}</code></div>
      </>
    ),
  },
  { clave: 'proveedor', titulo: 'Proveedor', render: (c) => c.proveedor?.razon_social },
  { clave: 'precio', titulo: 'Precio', alinear: 'derecha', render: (c) => dinero(c.precio) },
  { clave: 'dias_entrega', titulo: 'Entrega', render: (c) => (c.dias_entrega != null ? `${c.dias_entrega} día(s)` : '—') },
  {
    clave: 'vigencia_hasta',
    titulo: 'Vigencia',
    render: (c) => (
      <span className="sin-corte">
        {fecha(c.vigencia_hasta)}{' '}
        {c.vigencia_hasta < hoyISO() && <Insignia texto="Vencida" clase="insignia-inactivo" />}
      </span>
    ),
  },
];

const Formulario = formularioDe([
  { nombre: 'producto_id', etiqueta: 'Producto', tipo: 'relacion', requerido: true, fuente: fuentes.producto, ancho: 'completo' },
  { nombre: 'proveedor_id', etiqueta: 'Proveedor', tipo: 'relacion', requerido: true, fuente: fuentes.proveedorActivo, ancho: 'completo' },
  { nombre: 'precio', etiqueta: 'Precio ofrecido (₡)', tipo: 'dinero', requerido: true },
  { nombre: 'dias_entrega', etiqueta: 'Días de entrega', tipo: 'numero' },
  { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { nombre: 'vigencia_hasta', etiqueta: 'Vigente hasta', tipo: 'fecha', requerido: true },
  { nombre: 'observaciones', etiqueta: 'Observaciones', tipo: 'area', max: 255, ancho: 'completo' },
]);

export default function CotizacionesPage() {
  return (
    <PaginaCatalogo
      titulo="Cotizaciones"
      descripcion="Precios que ofrecen los proveedores por cada producto. Sirven para comparar antes de emitir la orden."
      singular="Cotización"
      femenino
      api={cotizacionesApi}
      metricas={metricas.cotizaciones}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={[(c) => c.producto?.nombre, (c) => c.producto?.codigo, (c) => c.proveedor?.razon_social]}
      nombreDe={(c) => `${c.producto?.nombre} · ${c.proveedor?.razon_social}`}
    />
  );
}
