import { useEffect, useState } from 'react';
import Campo from './Campo';
import PieFormulario from './PieFormulario';
import SelectRelacion from './SelectRelacion';
import { useFormulario } from '../hooks/useFormulario';
import { fuentes } from '../services/fuentes';
import { ordenesApi } from '../services/recursos';
import { movimientosApi } from '../services/inventario';
import { entero, hoyISO, numeroONulo, textoONulo } from '../utils/formato';

// Pedido y pendiente de cada material de una orden (lo recibido sale de sus entradas)
async function cargarPendientes(ordenId) {
  const [orden, entradas] = await Promise.all([
    ordenesApi.obtener(ordenId),
    movimientosApi.listar({ orden_id: ordenId, tipo: 'entrada' }),
  ]);
  const porProducto = new Map();
  for (const d of orden.detalles) {
    const actual = porProducto.get(d.producto_id) ?? { producto: d.producto, pedida: 0, recibida: 0 };
    actual.pedida += d.cantidad;
    porProducto.set(d.producto_id, actual);
  }
  for (const m of entradas) {
    const actual = porProducto.get(m.producto?.id);
    if (actual) actual.recibida += m.cantidad;
  }
  return [...porProducto.entries()].map(([producto_id, l]) => ({ producto_id, ...l, pendiente: Math.max(l.pedida - l.recibida, 0) }));
}

/**
 * Recepción de mercancía. Al crearla, cada material recibido genera una entrada de
 * inventario ligada a la orden (trazabilidad). Al editar solo cambian fecha, quién recibió
 * y las observaciones: las entradas ya registradas no se modifican.
 */
export default function RecepcionForm({ inicial, onGuardar, onCancelar }) {
  const esEdicion = Boolean(inicial.id);
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    orden_id: inicial.orden_id ?? '',
    bodega_id: inicial.bodega_id ?? '',
    fecha: inicial.fecha ?? hoyISO(),
    empleado_id: inicial.empleado_id ?? '',
    observaciones: inicial.observaciones ?? '',
  });

  const [lineas, setLineas] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [cargandoLineas, setCargandoLineas] = useState(false);

  useEffect(() => {
    if (esEdicion || !valores.orden_id) {
      setLineas([]);
      return undefined;
    }
    let activo = true;
    setCargandoLineas(true);
    cargarPendientes(valores.orden_id)
      .then((l) => {
        if (!activo) return;
        setLineas(l);
        setCantidades(Object.fromEntries(l.map((x) => [x.producto_id, String(x.pendiente)])));
      })
      .catch(() => activo && setLineas([]))
      .finally(() => activo && setCargandoLineas(false));
    return () => {
      activo = false;
    };
  }, [valores.orden_id, esEdicion]);

  function alEnviar(e) {
    e.preventDefault();
    const datos = {
      fecha: valores.fecha,
      empleado_id: numeroONulo(valores.empleado_id),
      observaciones: textoONulo(valores.observaciones),
    };
    if (!esEdicion) {
      datos.orden_id = numeroONulo(valores.orden_id);
      datos.bodega_id = numeroONulo(valores.bodega_id);
      const recibidas = lineas
        .map((l) => ({ producto_id: l.producto_id, cantidad: Number(cantidades[l.producto_id]) || 0 }))
        .filter((l) => l.cantidad > 0);
      if (recibidas.length) datos.lineas = recibidas;
    }
    enviar(() => onGuardar(datos));
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Orden de compra" requerido error={errores.orden_id} ayuda="Solo órdenes aprobadas o recibidas" className="ancho-completo">
            <SelectRelacion {...enlazar('orden_id')} required disabled={esEdicion} fuente={fuentes.ordenAprobada} valorActual={inicial.orden_id} autoFocus />
          </Campo>
          <Campo etiqueta="Bodega u obra que recibe" requerido error={errores.bodega_id}>
            <SelectRelacion {...enlazar('bodega_id')} required disabled={esEdicion} fuente={fuentes.bodega} valorActual={inicial.bodega_id} />
          </Campo>
          <Campo etiqueta="Fecha" requerido error={errores.fecha}>
            <input {...enlazar('fecha')} type="date" required />
          </Campo>
          <Campo etiqueta="Recibido por" requerido error={errores.empleado_id} className="ancho-completo">
            <SelectRelacion {...enlazar('empleado_id')} required fuente={fuentes.empleado} valorActual={inicial.empleado_id} />
          </Campo>

          {!esEdicion && valores.orden_id && (
            <div className="ancho-completo">
              <span className="campo-etiqueta">Materiales recibidos</span>
              {cargandoLineas ? (
                <p className="texto-suave">Cargando las líneas de la orden…</p>
              ) : (
                <table className="lineas-recepcion">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th className="derecha">Pedido</th>
                      <th className="derecha">Ya recibido</th>
                      <th>Recibido ahora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l) => (
                      <tr key={l.producto_id}>
                        <td>
                          {l.producto?.codigo} · {l.producto?.nombre}
                        </td>
                        <td className="derecha">{entero(l.pedida)}</td>
                        <td className="derecha">{entero(l.recibida)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={l.pendiente}
                            step="1"
                            value={cantidades[l.producto_id] ?? ''}
                            disabled={l.pendiente === 0}
                            aria-label={`Cantidad recibida de ${l.producto?.nombre}`}
                            onChange={(e) => setCantidades((c) => ({ ...c, [l.producto_id]: e.target.value }))}
                          />{' '}
                          <span className="texto-suave">{l.producto?.unidad}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <span className="campo-ayuda">
                Cada cantidad entra al inventario de la bodega elegida. Cuando se recibe todo lo pedido, la orden pasa a “Recibida”.
              </span>
            </div>
          )}

          {esEdicion && inicial.movimientos?.length > 0 && (
            <div className="ancho-completo nota-stock">
              Entradas registradas:{' '}
              {inicial.movimientos.map((m) => `${entero(m.cantidad)} ${m.producto?.unidad} de ${m.producto?.nombre}`).join(' · ')}. No se pueden
              cambiar; un error se corrige con un ajuste.
            </div>
          )}

          <Campo etiqueta="Observaciones" error={errores.observaciones} className="ancho-completo">
            <textarea {...enlazar('observaciones')} rows={2} maxLength={255} />
          </Campo>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
