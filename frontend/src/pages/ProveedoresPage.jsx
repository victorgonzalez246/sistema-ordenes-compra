import PaginaCatalogo from '../components/PaginaCatalogo';
import ProveedorForm from '../components/ProveedorForm';
import { proveedoresApi } from '../services/recursos';
import { metricas } from '../services/metricas';

const columnas = [
  { clave: 'razon_social', titulo: 'Razón social', render: (p) => <strong>{p.razon_social}</strong> },
  { clave: 'cedula_juridica', titulo: 'Cédula jurídica', render: (p) => <span className="sin-corte">{p.cedula_juridica}</span> },
  { clave: 'email', titulo: 'Email', render: (p) => <a href={`mailto:${p.email}`}>{p.email}</a> },
  { clave: 'telefono', titulo: 'Teléfono', render: (p) => <span className="sin-corte">{p.telefono || '—'}</span> },
  {
    clave: 'activo',
    titulo: 'Estado',
    render: (p) => (
      <span className={`insignia ${p.activo ? 'insignia-activo' : 'insignia-inactivo'}`}>
        {p.activo ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

const busqueda = ['razon_social', 'cedula_juridica', 'email', 'telefono'];

export default function ProveedoresPage() {
  return (
    <PaginaCatalogo
      titulo="Proveedores"
      descripcion="Empresas a las que se compra. Un proveedor con órdenes no se elimina: márcalo como inactivo."
      singular="Proveedor"
      api={proveedoresApi}
      metricas={metricas.proveedores}
      columnas={columnas}
      Formulario={ProveedorForm}
      camposBusqueda={busqueda}
      nombreDe={(p) => p.razon_social}
    />
  );
}
