/**
 * Cálculo del punto de reorden. Funciones puras: no tocan la base de datos.
 *
 * Fórmulas del enunciado (Quiz #2, ejercicio A5):
 *   SS = (demanda diaria máxima − demanda diaria promedio) × tiempo de entrega
 *   PR = demanda diaria promedio × tiempo de entrega + SS
 */

const redondear = (n) => Math.round(n * 100) / 100;

const numero = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/**
 * Stock de seguridad y punto de reorden de un material.
 * Devuelve null en ambos si faltan la demanda promedio o el tiempo de entrega.
 * Si no hay demanda máxima se toma igual a la promedio (SS = 0).
 */
function parametrosReorden({ demanda_promedio, demanda_maxima, tiempo_entrega }) {
  const d = numero(demanda_promedio);
  const L = numero(tiempo_entrega);
  if (d === null || L === null) return { stock_seguridad: null, punto_reorden: null };

  const dMax = Math.max(numero(demanda_maxima) ?? d, d);
  const stock_seguridad = redondear((dMax - d) * L);
  return { stock_seguridad, punto_reorden: redondear(d * L + stock_seguridad) };
}

/**
 * Estado de reposición de un material según su stock actual (de todas las bodegas).
 *   urgente: el stock no alcanza para cubrir la demanda durante el tiempo de entrega (stock ≤ d × L);
 *            si se pide hoy, igual se agota antes de que llegue.
 *   reponer: el stock alcanzó o cayó por debajo del punto de reorden (stock ≤ PR).
 *   ok:      el stock está por encima del punto de reorden.
 *   sin_parametros: el material no tiene demanda o tiempo de entrega registrados.
 *
 * cantidad_sugerida: lo necesario para llegar al stock máximo; si no hay máximo,
 * para volver al punto de reorden más el consumo de un ciclo de entrega (PR + d × L).
 */
function evaluarReorden(material, stock) {
  const { stock_seguridad, punto_reorden } = parametrosReorden(material);
  const d = numero(material.demanda_promedio);
  const L = numero(material.tiempo_entrega);
  const actual = Number(stock) || 0;

  if (punto_reorden === null) {
    return { stock: actual, stock_seguridad, punto_reorden, estado: 'sin_parametros', dias_cobertura: null, cantidad_sugerida: 0 };
  }

  const dias_cobertura = d > 0 ? redondear(actual / d) : null;

  let estado = 'ok';
  if (d > 0 && actual <= d * L) estado = 'urgente';
  else if (d > 0 && actual <= punto_reorden) estado = 'reponer';

  let cantidad_sugerida = 0;
  if (estado !== 'ok') {
    const maximo = numero(material.stock_maximo);
    const objetivo = maximo !== null ? maximo : punto_reorden + d * L;
    cantidad_sugerida = Math.max(Math.ceil(objetivo - actual), 0);
  }

  return { stock: actual, stock_seguridad, punto_reorden, estado, dias_cobertura, cantidad_sugerida };
}

/**
 * Orden de prioridad para reponer: primero los urgentes; dentro de cada grupo,
 * el que tiene menos días de cobertura de sobra frente a su tiempo de entrega.
 */
function compararPrioridad(a, b) {
  const peso = { urgente: 0, reponer: 1, ok: 2, sin_parametros: 3 };
  if (peso[a.estado] !== peso[b.estado]) return peso[a.estado] - peso[b.estado];
  const holgura = (x) => (x.dias_cobertura ?? Infinity) - (Number(x.tiempo_entrega) || 0);
  return holgura(a) - holgura(b);
}

module.exports = { parametrosReorden, evaluarReorden, compararPrioridad };
