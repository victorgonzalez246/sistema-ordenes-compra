import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import { InsigniaActivo } from '../components/Insignia';
import { metodosPagoApi } from '../services/recursos';

const columnas = [
  { clave: 'nombre', titulo: 'Método de pago', render: (m) => <strong>{m.nombre}</strong> },
  { clave: 'descripcion', titulo: 'Descripción', render: (m) => m.descripcion || '—' },
  { clave: 'activo', titulo: 'Estado', render: (m) => <InsigniaActivo activo={m.activo} /> },
];

const Formulario = formularioDe([
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 60, ancho: 'completo' },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'area', max: 255, ancho: 'completo' },
  { nombre: 'activo', etiqueta: 'Método activo', tipo: 'casilla', defecto: true, ayuda: 'los inactivos no se ofrecen al registrar pagos' },
]);

export default function MetodosPagoPage() {
  return (
    <PaginaCatalogo
      titulo="Métodos de pago"
      descripcion="Formas de pago a proveedores. Un método con pagos registrados no se elimina: márcalo como inactivo."
      singular="Método de pago"
      api={metodosPagoApi}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['nombre', 'descripcion']}
      nombreDe={(m) => m.nombre}
    />
  );
}
