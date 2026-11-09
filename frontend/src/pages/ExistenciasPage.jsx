import PaginaCatalogo from '../components/PaginaCatalogo';
import { formularioDe } from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { existenciasApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { metricas } from '../services/metricas';

const columnas = [
  {
    clave: 'producto',
    titulo: 'Producto',
    render: (e) => (
      <>
        <strong>{e.producto?.nombre}</strong>
        <div className="texto-suave"><code>{e.producto?.codigo}</code></div>
      </>
    ),
  },
  { clave: 'bodega', titulo: 'Bodega', render: (e) => e.bodega?.nombre },
  {
    clave: 'cantidad',
    titulo: 'Cantidad',
    alinear: 'derecha',
    render: (e) => `${e.cantidad.toLocaleString('es-CR')} ${e.producto?.unidad ?? ''}`,
  },
  { clave: 'minimo', titulo: 'Mínimo', alinear: 'derecha', render: (e) => e.minimo.toLocaleString('es-CR') },
  {
    clave: 'estado',
    titulo: 'Estado',
    render: (e) =>
      e.cantidad < e.minimo ? (
        <Insignia texto="Bajo el mínimo" clase="estado-rechazada" />
      ) : (
        <Insignia texto="Suficiente" clase="insignia-activo" />
      ),
  },
];

const Formulario = formularioDe([
  // La cantidad no se digita: sale de los movimientos de inventario
  { nombre: 'producto_id', etiqueta: 'Producto', tipo: 'relacion', requerido: true, fuente: fuentes.producto, ancho: 'completo', soloCrear: true },
  { nombre: 'bodega_id', etiqueta: 'Bodega', tipo: 'relacion', requerido: true, fuente: fuentes.bodega, ancho: 'completo', soloCrear: true },
  { nombre: 'minimo', etiqueta: 'Mínimo en esta bodega', tipo: 'numero', defecto: '0', ayuda: 'Por debajo de este valor hay que reponer' },
]);

export default function ExistenciasPage() {
  return (
    <PaginaCatalogo
      titulo="Existencias"
      descripcion="Cantidad de cada producto por bodega u obra. La cantidad se calcula con los movimientos de inventario; aquí solo se define el mínimo de cada bodega."
      singular="Existencia"
      femenino
      api={existenciasApi}
      metricas={metricas.existencias}
      columnas={columnas}
      Formulario={Formulario}
      camposBusqueda={[(e) => e.producto?.nombre, (e) => e.producto?.codigo, (e) => e.bodega?.nombre]}
      nombreDe={(e) => `${e.producto?.nombre} en ${e.bodega?.nombre}`}
    />
  );
}
