import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { contactosApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { metricas } from '../services/metricas';

const columnas = [
  {
    clave: 'nombre',
    titulo: 'Contacto',
    render: (c) => (
      <>
        <strong>{c.nombre}</strong> {c.principal && <Insignia texto="Principal" clase="insignia-activo" />}
        <div className="texto-suave">{c.puesto || '—'}</div>
      </>
    ),
  },
  { clave: 'proveedor', titulo: 'Proveedor', render: (c) => c.proveedor?.razon_social },
  { clave: 'email', titulo: 'Email', render: (c) => <a href={`mailto:${c.email}`}>{c.email}</a> },
  { clave: 'telefono', titulo: 'Teléfono', render: (c) => <span className="sin-corte">{c.telefono || '—'}</span> },
];

const Formulario = formularioDe([
  { nombre: 'proveedor_id', etiqueta: 'Proveedor', tipo: 'relacion', requerido: true, fuente: fuentes.proveedor, ancho: 'completo' },
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120 },
  { nombre: 'puesto', etiqueta: 'Puesto', tipo: 'texto', max: 80 },
  { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, max: 120 },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', max: 30, placeholder: '+506 8888-9999' },
  { nombre: 'principal', etiqueta: 'Contacto principal', tipo: 'casilla', ayuda: 'reemplaza al contacto principal actual del proveedor' },
]);

export default function ContactosPage() {
  return (
    <PaginaCatalogo
      titulo="Contactos de proveedor"
      descripcion="Personas con las que se trata en cada proveedor. Cada proveedor tiene un solo contacto principal."
      singular="Contacto"
      api={contactosApi}
      metricas={metricas.contactos}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['nombre', 'puesto', 'email', 'telefono', (c) => c.proveedor?.razon_social]}
      nombreDe={(c) => c.nombre}
    />
  );
}
