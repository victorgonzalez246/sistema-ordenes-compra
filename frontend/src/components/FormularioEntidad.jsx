import Campo from './Campo';
import PieFormulario from './PieFormulario';
import SelectRelacion from './SelectRelacion';
import { useFormulario } from '../hooks/useFormulario';

/**
 * Formulario de alta y edición armado a partir de una lista de campos.
 *
 * Cada campo: { nombre, etiqueta, tipo, requerido, max, ayuda, ancho, defecto, ... }
 *   tipo: texto | email | tel | area | numero | dinero | fecha | select | relacion | casilla
 *   select:   opciones [{ valor, texto, deshabilitado }]
 *   relacion: fuente { api, texto, filtro }
 *   soloEditar / soloCrear: el campo aparece solo al editar o solo al crear
 *
 * Al editar se envían únicamente los campos que cambiaron.
 */
const TIPO_INPUT = { texto: 'text', email: 'email', tel: 'tel', numero: 'number', dinero: 'number', fecha: 'date', password: 'password' };

function valorInicial(campo, inicial) {
  const valor = inicial[campo.nombre];
  if (campo.tipo === 'casilla') return valor ?? campo.defecto ?? false;
  if (valor === null || valor === undefined) return campo.defecto ?? '';
  return String(valor);
}

// Valor del formulario -> valor para la API
function convertir(campo, valor) {
  if (campo.tipo === 'casilla') return Boolean(valor);
  if (['numero', 'dinero', 'relacion'].includes(campo.tipo)) return valor === '' ? null : Number(valor);
  const limpio = String(valor ?? '').trim();
  return limpio === '' ? null : limpio;
}

export default function FormularioEntidad({ campos, inicial, onGuardar, onCancelar }) {
  const esEdicion = Boolean(inicial.id);
  const visibles = campos.filter((c) => !(c.soloEditar && !esEdicion) && !(c.soloCrear && esEdicion));

  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario(
    Object.fromEntries(visibles.map((c) => [c.nombre, valorInicial(c, inicial)]))
  );

  function alEnviar(e) {
    e.preventDefault();
    const datos = {};
    for (const campo of visibles) {
      const valor = convertir(campo, valores[campo.nombre]);
      if (!esEdicion || valor !== (inicial[campo.nombre] ?? null)) datos[campo.nombre] = valor;
    }
    if (esEdicion && Object.keys(datos).length === 0) {
      onCancelar();
      return;
    }
    enviar(() => onGuardar(datos));
  }

  function control(campo, primero) {
    const props = { ...enlazar(campo.nombre), required: campo.requerido, autoFocus: primero };
    switch (campo.tipo) {
      case 'area':
        return <textarea {...props} rows={3} maxLength={campo.max} />;
      case 'select':
        return (
          <select {...props}>
            {campo.opciones.map((o) => (
              <option key={o.valor} value={o.valor} disabled={o.deshabilitado}>
                {o.texto}
              </option>
            ))}
          </select>
        );
      case 'relacion':
        return <SelectRelacion {...props} fuente={campo.fuente} valorActual={inicial[campo.nombre]} />;
      default:
        return (
          <input
            {...props}
            type={TIPO_INPUT[campo.tipo] || 'text'}
            maxLength={campo.max}
            min={['numero', 'dinero'].includes(campo.tipo) ? (campo.min ?? 0) : undefined}
            step={campo.tipo === 'dinero' ? '0.01' : campo.tipo === 'numero' ? '1' : undefined}
            inputMode={campo.tipo === 'dinero' ? 'decimal' : undefined}
            pattern={campo.patron}
            title={campo.patron ? campo.ayuda : undefined}
            placeholder={campo.placeholder}
            autoComplete={campo.tipo === 'password' ? 'new-password' : undefined}
          />
        );
    }
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          {visibles.map((campo, i) =>
            campo.tipo === 'casilla' ? (
              <label key={campo.nombre} className="interruptor ancho-completo">
                <input
                  type="checkbox"
                  name={campo.nombre}
                  checked={Boolean(valores[campo.nombre])}
                  onChange={enlazar(campo.nombre).onChange}
                />
                <span>
                  {campo.etiqueta}
                  {campo.ayuda && <small className="texto-suave"> · {campo.ayuda}</small>}
                </span>
              </label>
            ) : (
              <Campo
                key={campo.nombre}
                etiqueta={campo.etiqueta}
                requerido={campo.requerido}
                error={errores[campo.nombre]}
                ayuda={campo.ayuda}
                className={campo.ancho === 'completo' ? 'ancho-completo' : ''}
              >
                {control(campo, i === 0)}
              </Campo>
            )
          )}
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}

// Crea el componente de formulario que espera PaginaCatalogo
export function formularioDe(campos) {
  return function Formulario(props) {
    return <FormularioEntidad campos={campos} {...props} />;
  };
}
