import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import { categoriasApi } from '../services/recursos';

const columnas = [
  { clave: 'nombre', titulo: 'Categoría', render: (c) => <strong>{c.nombre}</strong> },
  { clave: 'descripcion', titulo: 'Descripción', render: (c) => c.descripcion || '—' },
];

const Formulario = formularioDe([
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 80, ancho: 'completo' },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'area', max: 255, ancho: 'completo' },
]);

export default function CategoriasPage() {
  return (
    <PaginaCatalogo
      titulo="Categorías"
      descripcion="Agrupan los productos del catálogo. Una categoría con productos no se elimina."
      singular="Categoría"
      femenino
      api={categoriasApi}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={['nombre', 'descripcion']}
      nombreDe={(c) => c.nombre}
    />
  );
}
