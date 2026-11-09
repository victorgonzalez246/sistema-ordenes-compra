import Campo from './Campo';
import PieFormulario from './PieFormulario';
import { useFormulario } from '../hooks/useFormulario';
import SelectRelacion from './SelectRelacion';
import { numeroONulo } from '../utils/formato';
import { fuentes } from '../services/fuentes';

const UNIDADES = ['unidad', 'saco', 'm³', 'par', 'caja', 'paquete', 'kit', 'metro', 'kilogramo', 'litro', 'galón', 'servicio'];

const texto = (v) => (v === null || v === undefined ? '' : String(v));

// Misma fórmula que el backend (services/reorden.js), solo para mostrar una vista previa
function vistaPrevia({ demanda_promedio, demanda_maxima, tiempo_entrega }) {
  const d = numeroONulo(demanda_promedio);
  const L = numeroONulo(tiempo_entrega);
  if (d === null || L === null) return null;
  const dMax = Math.max(numeroONulo(demanda_maxima) ?? d, d);
  const ss = (dMax - d) * L;
  return { ss, pr: d * L + ss };
}

export default function ProductoForm({ inicial, onGuardar, onCancelar }) {
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    codigo: inicial.codigo ?? '',
    nombre: inicial.nombre ?? '',
    unidad: inicial.unidad ?? '',
    precio_ref: texto(inicial.precio_ref),
    categoria_id: inicial.categoria_id ?? '',
    stock_minimo: texto(inicial.stock_minimo),
    stock_maximo: texto(inicial.stock_maximo),
    demanda_promedio: texto(inicial.demanda_promedio),
    demanda_maxima: texto(inicial.demanda_maxima),
    tiempo_entrega: texto(inicial.tiempo_entrega),
  });

  function alEnviar(e) {
    e.preventDefault();
    enviar(() =>
      onGuardar({
        codigo: valores.codigo.trim(),
        nombre: valores.nombre.trim(),
        unidad: valores.unidad.trim(),
        precio_ref: numeroONulo(valores.precio_ref),
        categoria_id: numeroONulo(valores.categoria_id),
        stock_minimo: numeroONulo(valores.stock_minimo),
        stock_maximo: numeroONulo(valores.stock_maximo),
        demanda_promedio: numeroONulo(valores.demanda_promedio),
        demanda_maxima: numeroONulo(valores.demanda_maxima),
        tiempo_entrega: numeroONulo(valores.tiempo_entrega),
      })
    );
  }

  const calculo = vistaPrevia(valores);

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Código" requerido error={errores.codigo} ayuda="Ejemplo: MAT-CEM-001">
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
          <Campo etiqueta="Categoría" error={errores.categoria_id}>
            <SelectRelacion {...enlazar('categoria_id')} fuente={fuentes.categoria} valorActual={inicial.categoria_id} />
          </Campo>
          <Campo etiqueta="Precio de referencia (₡)" error={errores.precio_ref}>
            <input {...enlazar('precio_ref')} type="number" min="0" step="0.01" inputMode="decimal" />
          </Campo>

          <Campo etiqueta="Demanda diaria promedio" error={errores.demanda_promedio}>
            <input {...enlazar('demanda_promedio')} type="number" min="0" step="0.01" inputMode="decimal" />
          </Campo>
          <Campo etiqueta="Demanda diaria máxima" error={errores.demanda_maxima}>
            <input {...enlazar('demanda_maxima')} type="number" min="0" step="0.01" inputMode="decimal" />
          </Campo>
          <Campo etiqueta="Tiempo de entrega (días)" error={errores.tiempo_entrega}>
            <input {...enlazar('tiempo_entrega')} type="number" min="0" step="1" />
          </Campo>
          <Campo etiqueta="Stock mínimo" error={errores.stock_minimo}>
            <input {...enlazar('stock_minimo')} type="number" min="0" step="1" />
          </Campo>
          <Campo etiqueta="Stock máximo" error={errores.stock_maximo} ayuda="Se usa para sugerir cuánto pedir">
            <input {...enlazar('stock_maximo')} type="number" min="0" step="1" />
          </Campo>

          <div className="ancho-completo texto-suave">
            {calculo
              ? `Calculado: stock de seguridad ${calculo.ss.toLocaleString('es-CR')} · punto de reorden ${calculo.pr.toLocaleString('es-CR')}`
              : 'Ingrese la demanda promedio y el tiempo de entrega para calcular el punto de reorden.'}
          </div>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
