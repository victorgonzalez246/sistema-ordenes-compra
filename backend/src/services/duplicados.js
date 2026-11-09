/**
 * Detección de posibles compras duplicadas. Función pura: recibe las órdenes ya cargadas.
 *
 * Regla: dos órdenes son posibles duplicadas si
 *   1. son del mismo proveedor,
 *   2. sus fechas están a `dias` días o menos de distancia,
 *   3. comparten al menos un artículo, y
 *   4. la cantidad de ese artículo difiere en `tolerancia` % o menos (respecto a la mayor).
 *
 * Nivel de sospecha:
 *   alta:  misma cantidad y a lo sumo 1 día de diferencia (casi seguro un doble registro).
 *   media: cumple la regla, pero con cantidades o fechas algo distintas (revisar).
 */

const MS_DIA = 24 * 60 * 60 * 1000;
const redondear = (n) => Math.round(n * 100) / 100;

function diasEntre(a, b) {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.abs(Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / MS_DIA;
}

/**
 * @param ordenes [{ id, numero, fecha: 'AAAA-MM-DD', proveedor_id, proveedor, departamento,
 *                   lineas: [{ producto_id, producto, cantidad, precio_unitario }] }]
 * @param opciones { dias, tolerancia } tolerancia en porcentaje (10 = 10 %)
 */
function detectarDuplicados(ordenes, { dias = 7, tolerancia = 10 } = {}) {
  const ordenadas = [...ordenes].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
  const resultado = [];

  for (let i = 0; i < ordenadas.length; i += 1) {
    for (let j = i + 1; j < ordenadas.length; j += 1) {
      const a = ordenadas[i];
      const b = ordenadas[j];
      if (a.proveedor_id !== b.proveedor_id) continue;

      const distancia = diasEntre(a.fecha, b.fecha);
      if (distancia > dias) continue;

      const coincidencias = [];
      for (const la of a.lineas) {
        for (const lb of b.lineas) {
          if (la.producto_id !== lb.producto_id) continue;
          const mayor = Math.max(la.cantidad, lb.cantidad);
          const diferencia = mayor === 0 ? 0 : (Math.abs(la.cantidad - lb.cantidad) / mayor) * 100;
          if (diferencia > tolerancia) continue;
          coincidencias.push({
            producto_id: la.producto_id,
            producto: la.producto,
            cantidad_original: la.cantidad,
            cantidad_posible_duplicado: lb.cantidad,
            diferencia_cantidad_pct: redondear(diferencia),
            monto_en_riesgo: redondear(lb.cantidad * lb.precio_unitario),
          });
        }
      }
      if (!coincidencias.length) continue;

      const mismaCantidad = coincidencias.every((c) => c.diferencia_cantidad_pct === 0);
      const nivel = mismaCantidad && distancia <= 1 ? 'alta' : 'media';

      resultado.push({
        nivel,
        orden_original: resumen(a),
        posible_duplicado: resumen(b),
        dias_entre_ordenes: distancia,
        coincidencias,
        monto_en_riesgo: redondear(coincidencias.reduce((s, c) => s + c.monto_en_riesgo, 0)),
        motivo:
          `Mismo proveedor, ${distancia === 0 ? 'misma fecha' : `${distancia} día(s) de diferencia`} y ` +
          `${coincidencias.length} artículo(s) con cantidad ${mismaCantidad ? 'idéntica' : 'similar'}`,
      });
    }
  }

  const peso = { alta: 0, media: 1 };
  return resultado.sort((x, y) => peso[x.nivel] - peso[y.nivel] || y.monto_en_riesgo - x.monto_en_riesgo);
}

function resumen(o) {
  return { id: o.id, numero: o.numero, fecha: o.fecha, estado: o.estado, proveedor: o.proveedor, departamento: o.departamento };
}

module.exports = { detectarDuplicados, diasEntre };
