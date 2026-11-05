import PaginaCatalogo from '../components/PaginaCatalogo';
import DepartamentoForm from '../components/DepartamentoForm';
import { departamentosApi } from '../services/recursos';
import { dinero } from '../utils/formato';

const columnas = [
  { clave: 'nombre', titulo: 'Departamento', render: (d) => <strong>{d.nombre}</strong> },
  { clave: 'centro_costo', titulo: 'Centro de costo' },
  { clave: 'presupuesto', titulo: 'Presupuesto', alinear: 'derecha', render: (d) => dinero(d.presupuesto) },
];

const busqueda = ['nombre', 'centro_costo'];

export default function DepartamentosPage() {
  return (
    <PaginaCatalogo
      titulo="Departamentos"
      descripcion="Áreas que solicitan compras, con su centro de costo y presupuesto."
      singular="Departamento"
      api={departamentosApi}
      columnas={columnas}
      Formulario={DepartamentoForm}
      camposBusqueda={busqueda}
      nombreDe={(d) => d.nombre}
    />
  );
}
