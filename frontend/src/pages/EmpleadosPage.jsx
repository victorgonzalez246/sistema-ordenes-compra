import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import { InsigniaActivo } from '../components/Insignia';
import { empleadosApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { metricas } from '../services/metricas';

const columnas = [
  {
    clave: 'nombre',
    titulo: 'Empleado',
    render: (e) => (
      <>
        <strong>{e.nombre}</strong>
        <div className="texto-suave">{e.puesto}</div>
      </>
    ),
  },
  { clave: 'cedula', titulo: 'Cédula', render: (e) => <span className="sin-corte">{e.cedula}</span> },
  { clave: 'departamento', titulo: 'Departamento', render: (e) => e.departamento?.nombre },
  { clave: 'email', titulo: 'Email', render: (e) => <a href={`mailto:${e.email}`}>{e.email}</a> },
  { clave: 'activo', titulo: 'Estado', render: (e) => <InsigniaActivo activo={e.activo} /> },
];

const Formulario = formularioDe([
  { nombre: 'nombre', etiqueta: 'Nombre completo', tipo: 'texto', requerido: true, max: 120, ancho: 'completo' },
  { nombre: 'cedula', etiqueta: 'Cédula', tipo: 'texto', requerido: true, max: 12, patron: '[0-9]-[0-9]{4}-[0-9]{4}', ayuda: 'Formato: 1-2345-6789', placeholder: '1-2345-6789' },
  { nombre: 'puesto', etiqueta: 'Puesto', tipo: 'texto', requerido: true, max: 80 },
  { nombre: 'departamento_id', etiqueta: 'Departamento', tipo: 'relacion', requerido: true, fuente: fuentes.departamento, ancho: 'completo' },
  { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, max: 120 },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', max: 30, placeholder: '+506 8888-9999' },
  { nombre: 'activo', etiqueta: 'Empleado activo', tipo: 'casilla', defecto: true, ayuda: 'los inactivos no pueden solicitar compras ni recibir mercancía' },
]);

export default function EmpleadosPage() {
  return (
    <PaginaCatalogo
      titulo="Empleados"
      descripcion="Personas que solicitan compras y reciben mercancía. Con requisiciones o recepciones no se eliminan: márcalos como inactivos."
      singular="Empleado"
      api={empleadosApi}
      metricas={metricas.empleados}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['nombre', 'cedula', 'puesto', 'email', (e) => e.departamento?.nombre]}
      nombreDe={(e) => e.nombre}
    />
  );
}
