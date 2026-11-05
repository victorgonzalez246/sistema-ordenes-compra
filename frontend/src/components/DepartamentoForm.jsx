import Campo from './Campo';
import PieFormulario from './PieFormulario';
import { useFormulario } from '../hooks/useFormulario';
import { numeroONulo } from '../utils/formato';

export default function DepartamentoForm({ inicial, onGuardar, onCancelar }) {
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    nombre: inicial.nombre ?? '',
    centro_costo: inicial.centro_costo ?? '',
    presupuesto: inicial.presupuesto ?? '',
  });

  function alEnviar(e) {
    e.preventDefault();
    enviar(() =>
      onGuardar({
        nombre: valores.nombre.trim(),
        centro_costo: valores.centro_costo.trim(),
        presupuesto: numeroONulo(valores.presupuesto),
      })
    );
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Nombre" requerido error={errores.nombre} className="ancho-completo">
            <input {...enlazar('nombre')} required maxLength={100} autoFocus />
          </Campo>
          <Campo etiqueta="Centro de costo" requerido error={errores.centro_costo} ayuda="Ejemplo: CC-100">
            <input {...enlazar('centro_costo')} required maxLength={20} />
          </Campo>
          <Campo etiqueta="Presupuesto (₡)" error={errores.presupuesto}>
            <input {...enlazar('presupuesto')} type="number" min="0" step="0.01" inputMode="decimal" />
          </Campo>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
