import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import { InsigniaActivo } from '../components/Insignia';
import { bodegasApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { metricas } from '../services/metricas';

const columnas = [
  { clave: 'nombre', titulo: 'Bodega', render: (b) => <strong>{b.nombre}</strong> },
  { clave: 'ubicacion', titulo: 'Ubicación' },
  { clave: 'responsable', titulo: 'Responsable', render: (b) => b.responsable?.nombre || '—' },
  { clave: 'activa', titulo: 'Estado', render: (b) => <InsigniaActivo activo={b.activa} femenino /> },
];

const Formulario = formularioDe([
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 80, ancho: 'completo' },
  { nombre: 'ubicacion', etiqueta: 'Ubicación', tipo: 'texto', requerido: true, max: 200, ancho: 'completo' },
  { nombre: 'responsable_id', etiqueta: 'Responsable', tipo: 'relacion', fuente: fuentes.empleado, ancho: 'completo' },
  { nombre: 'activa', etiqueta: 'Bodega activa', tipo: 'casilla', defecto: true, ayuda: 'las inactivas no reciben mercancía' },
]);

export default function BodegasPage() {
  return (
    <PaginaCatalogo
      titulo="Bodegas"
      descripcion="Lugares donde se recibe y almacena la mercancía. Una bodega con existencias o recepciones no se elimina."
      singular="Bodega"
      femenino
      api={bodegasApi}
      metricas={metricas.bodegas}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['nombre', 'ubicacion', (b) => b.responsable?.nombre]}
      nombreDe={(b) => b.nombre}
    />
  );
}
