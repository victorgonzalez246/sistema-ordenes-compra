import { useEffect, useState } from 'react';
import Campo from './Campo';
import PieFormulario from './PieFormulario';
import SelectRelacion from './SelectRelacion';
import { useFormulario } from '../hooks/useFormulario';
import { fuentes } from '../services/fuentes';
import { inventarioApi, ESTADOS_REORDEN } from '../services/inventario';
import { entero, hoyISO, numeroONulo, textoONulo } from '../utils/formato';

const AYUDA_TIPO = {
  entrada: 'Material que llega: por una orden de compra o por el inventario inicial.',
  salida: 'Material que se consume en una obra o en el taller (vale de salida).',
  traslado: 'Material que pasa de una bodega u obra a otra. No cambia el total de la empresa.',
  ajuste: 'Corrección por conteo físico. Debe explicar el motivo.',
};

/**
 * Alta de un movimiento. Los campos cambian según el tipo; las reglas finales
 * (stock suficiente, orden aprobada, cantidad pendiente) las valida el back end.
 */
export default function MovimientoForm({ onGuardar, onCancelar }) {
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    tipo: 'salida',
    fecha: hoyISO(),
    producto_id: '',
    cantidad: '',
    bodega_origen_id: '',
    bodega_destino_id: '',
    documento_tipo: 'orden_compra',
    documento_numero: '',
    orden_id: '',
    sentido: 'faltante',
    observaciones: '',
  });
  const { tipo } = valores;
  const porCompra = tipo === 'entrada' && valores.documento_tipo === 'orden_compra';

  // Stock actual del material elegido, para no adivinar cuánto hay
  const [stock, setStock] = useState(null);
  useEffect(() => {
    if (!valores.producto_id) return setStock(null);
    let activo = true;
    inventarioApi
      .stock(valores.producto_id)
      .then((s) => activo && setStock(s))
      .catch(() => activo && setStock(null));
    return () => {
      activo = false;
    };
  }, [valores.producto_id]);

  const usaOrigen = tipo === 'salida' || tipo === 'traslado' || (tipo === 'ajuste' && valores.sentido === 'faltante');
  const usaDestino = tipo === 'entrada' || tipo === 'traslado' || (tipo === 'ajuste' && valores.sentido === 'sobrante');

  function alEnviar(e) {
    e.preventDefault();
    const datos = {
      tipo,
      fecha: valores.fecha,
      producto_id: numeroONulo(valores.producto_id),
      cantidad: numeroONulo(valores.cantidad),
      bodega_origen_id: usaOrigen ? numeroONulo(valores.bodega_origen_id) : null,
      bodega_destino_id: usaDestino ? numeroONulo(valores.bodega_destino_id) : null,
      observaciones: textoONulo(valores.observaciones),
    };
    if (tipo === 'entrada') datos.documento_tipo = valores.documento_tipo;
    if (porCompra) datos.orden_id = numeroONulo(valores.orden_id);
    else datos.documento_numero = textoONulo(valores.documento_numero);
    enviar(() => onGuardar(datos));
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Tipo de movimiento" requerido error={errores.tipo} ayuda={AYUDA_TIPO[tipo]} className="ancho-completo">
            <select {...enlazar('tipo')} required autoFocus>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="traslado">Traslado</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </Campo>

          <Campo etiqueta="Material" requerido error={errores.producto_id} className="ancho-completo">
            <SelectRelacion {...enlazar('producto_id')} required fuente={fuentes.producto} />
          </Campo>

          {stock && (
            <div className="ancho-completo nota-stock">
              Stock total: <strong>{entero(stock.stock)} {stock.material.unidad}</strong>
              {stock.punto_reorden !== null && (
                <> · punto de reorden {entero(stock.punto_reorden)} · {ESTADOS_REORDEN[stock.estado]}</>
              )}
              {stock.por_bodega.length > 0 && (
                <div className="texto-suave">
                  {stock.por_bodega.map((b) => `${b.bodega}: ${entero(b.cantidad)}`).join(' · ')}
                </div>
              )}
            </div>
          )}

          <Campo etiqueta="Cantidad" requerido error={errores.cantidad}>
            <input {...enlazar('cantidad')} type="number" min="1" step="1" required />
          </Campo>
          <Campo etiqueta="Fecha" requerido error={errores.fecha}>
            <input {...enlazar('fecha')} type="date" required />
          </Campo>

          {tipo === 'ajuste' && (
            <Campo etiqueta="Resultado del conteo" requerido className="ancho-completo">
              <select {...enlazar('sentido')}>
                <option value="faltante">Falta material (sale de la bodega)</option>
                <option value="sobrante">Sobra material (entra a la bodega)</option>
              </select>
            </Campo>
          )}

          {usaOrigen && (
            <Campo etiqueta={tipo === 'traslado' ? 'Desde' : 'Bodega u obra'} requerido error={errores.bodega_origen_id}>
              <SelectRelacion {...enlazar('bodega_origen_id')} required fuente={fuentes.bodega} />
            </Campo>
          )}
          {usaDestino && (
            <Campo etiqueta={tipo === 'traslado' ? 'Hacia' : 'Bodega u obra que recibe'} requerido error={errores.bodega_destino_id}>
              <SelectRelacion {...enlazar('bodega_destino_id')} required fuente={fuentes.bodega} />
            </Campo>
          )}

          {tipo === 'entrada' && (
            <Campo etiqueta="Origen de la entrada" requerido error={errores.documento_tipo}>
              <select {...enlazar('documento_tipo')}>
                <option value="orden_compra">Orden de compra</option>
                <option value="inventario_inicial">Inventario inicial</option>
              </select>
            </Campo>
          )}

          {porCompra ? (
            <Campo
              etiqueta="Orden de compra"
              requerido
              error={errores.orden_id}
              ayuda="Para recibir una orden completa es más cómodo usar Recepciones"
              className="ancho-completo"
            >
              <SelectRelacion {...enlazar('orden_id')} required fuente={fuentes.ordenAprobada} />
            </Campo>
          ) : (
            <Campo
              etiqueta="Número de documento"
              requerido
              error={errores.documento_numero}
              ayuda={{ salida: 'Vale de salida, p. ej. VS-0201', traslado: 'Boleta, p. ej. BT-0040', ajuste: 'Acta de conteo, p. ej. AJ-0002' }[tipo] ?? 'p. ej. INV-2026-002'}
            >
              <input {...enlazar('documento_numero')} required maxLength={40} />
            </Campo>
          )}

          <Campo
            etiqueta={tipo === 'ajuste' ? 'Motivo del ajuste' : 'Observaciones'}
            requerido={tipo === 'ajuste'}
            error={errores.observaciones}
            className="ancho-completo"
          >
            <textarea {...enlazar('observaciones')} rows={2} maxLength={255} required={tipo === 'ajuste'} />
          </Campo>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} textoGuardar="Registrar movimiento" />
    </form>
  );
}
