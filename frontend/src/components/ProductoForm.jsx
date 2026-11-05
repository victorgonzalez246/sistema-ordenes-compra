import Campo from './Campo';
import PieFormulario from './PieFormulario';
import { useFormulario } from '../hooks/useFormulario';
import { numeroONulo } from '../utils/formato';

const UNIDADES = ['unidad', 'caja', 'paquete', 'kit', 'resma', 'metro', 'kilogramo', 'litro', 'galón', 'servicio'];

export default function ProductoForm({ inicial, onGuardar, onCancelar }) {
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    codigo: inicial.codigo ?? '',
    nombre: inicial.nombre ?? '',
    unidad: inicial.unidad ?? '',
    precio_ref: inicial.precio_ref ?? '',
  });

  function alEnviar(e) {
    e.preventDefault();
    enviar(() =>
      onGuardar({
        codigo: valores.codigo.trim(),
        nombre: valores.nombre.trim(),
        unidad: valores.unidad.trim(),
        precio_ref: numeroONulo(valores.precio_ref),
      })
    );
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Código" requerido error={errores.codigo} ayuda="Ejemplo: PAP-001">
            <input {...enlazar('codigo')} required maxLength={30} autoFocus />
          </Campo>
          <Campo etiqueta="Unidad" requerido error={errores.unidad}>
            <input {...enlazar('unidad')} required maxLength={20} list="unidades" />
            <datalist id="unidades">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Campo>
          <Campo etiqueta="Nombre" requerido error={errores.nombre} className="ancho-completo">
            <input {...enlazar('nombre')} required maxLength={150} />
          </Campo>
          <Campo etiqueta="Precio de referencia (₡)" error={errores.precio_ref}>
            <input {...enlazar('precio_ref')} type="number" min="0" step="0.01" inputMode="decimal" />
          </Campo>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
