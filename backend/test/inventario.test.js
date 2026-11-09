/**
 * Pruebas de las reglas de negocio del control de inventario (Quiz #2, opción 2).
 * Son funciones puras: no necesitan MySQL ni datos de ejemplo.
 *
 * Ejecutar: npm test  (o solo estas: node --test test/inventario.test.js)
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { parametrosReorden, evaluarReorden, compararPrioridad } = require('../src/services/reorden');
const { detectarDuplicados, diasEntre } = require('../src/services/duplicados');
const { validarForma } = require('../src/services/inventario');
const { msHasta } = require('../src/services/tareas');

// Materiales del ejercicio A5
const A5 = {
  cemento: { demanda_promedio: 40, demanda_maxima: 55, tiempo_entrega: 3, stock: 190 },
  varilla: { demanda_promedio: 120, demanda_maxima: 160, tiempo_entrega: 5, stock: 850 },
  block: { demanda_promedio: 600, demanda_maxima: 900, tiempo_entrega: 4, stock: 2800 },
  arena: { demanda_promedio: 6, demanda_maxima: 10, tiempo_entrega: 2, stock: 14 },
};

describe('punto de reorden (ejercicio A5)', () => {
  test('stock de seguridad y punto de reorden de los cuatro materiales', () => {
    assert.deepEqual(parametrosReorden(A5.cemento), { stock_seguridad: 45, punto_reorden: 165 });
    assert.deepEqual(parametrosReorden(A5.varilla), { stock_seguridad: 200, punto_reorden: 800 });
    assert.deepEqual(parametrosReorden(A5.block), { stock_seguridad: 1200, punto_reorden: 3600 });
    assert.deepEqual(parametrosReorden(A5.arena), { stock_seguridad: 8, punto_reorden: 20 });
  });

  test('hoy hay que reponer el block y la arena; el cemento y la varilla están bien', () => {
    const estado = (m) => evaluarReorden(m, m.stock).estado;
    assert.equal(estado(A5.cemento), 'ok');
    assert.equal(estado(A5.varilla), 'ok');
    assert.equal(estado(A5.block), 'reponer');
    assert.equal(estado(A5.arena), 'reponer');
  });

  test('prioridad: la arena va primero porque le sobran menos días de cobertura', () => {
    const lista = Object.entries(A5)
      .map(([nombre, m]) => ({ nombre, tiempo_entrega: m.tiempo_entrega, ...evaluarReorden(m, m.stock) }))
      .filter((m) => m.estado !== 'ok')
      .sort(compararPrioridad);
    assert.deepEqual(lista.map((m) => m.nombre), ['arena', 'block']);
  });

  test('urgente cuando el stock no cubre la demanda del tiempo de entrega', () => {
    assert.equal(evaluarReorden(A5.arena, 12).estado, 'urgente'); // 12 = 6 × 2
    assert.equal(evaluarReorden(A5.arena, 13).estado, 'reponer');
    assert.equal(evaluarReorden(A5.arena, 0).estado, 'urgente');
  });

  test('justo en el punto de reorden ya se debe pedir; una unidad arriba no', () => {
    assert.equal(evaluarReorden(A5.cemento, 165).estado, 'reponer');
    assert.equal(evaluarReorden(A5.cemento, 166).estado, 'ok');
  });

  test('cantidad sugerida: hasta el stock máximo, o PR + d × L si no hay máximo', () => {
    assert.equal(evaluarReorden({ ...A5.arena, stock_maximo: 40 }, 14).cantidad_sugerida, 26);
    assert.equal(evaluarReorden(A5.arena, 14).cantidad_sugerida, 18); // 20 + 12 − 14
    assert.equal(evaluarReorden(A5.cemento, 190).cantidad_sugerida, 0);
  });

  test('sin demanda o sin tiempo de entrega no se calcula nada', () => {
    const r = evaluarReorden({ demanda_promedio: null, tiempo_entrega: 3 }, 10);
    assert.equal(r.estado, 'sin_parametros');
    assert.equal(r.punto_reorden, null);
    assert.equal(parametrosReorden({ demanda_promedio: 5, tiempo_entrega: null }).punto_reorden, null);
  });

  test('sin demanda máxima el stock de seguridad es 0; si es menor que la promedio no da negativo', () => {
    assert.deepEqual(parametrosReorden({ demanda_promedio: 10, tiempo_entrega: 2 }), { stock_seguridad: 0, punto_reorden: 20 });
    assert.equal(parametrosReorden({ demanda_promedio: 10, demanda_maxima: 4, tiempo_entrega: 2 }).stock_seguridad, 0);
  });

  test('un material sin consumo (demanda 0) nunca pide reposición', () => {
    assert.equal(evaluarReorden({ demanda_promedio: 0, demanda_maxima: 0, tiempo_entrega: 5 }, 0).estado, 'ok');
  });

  test('acepta valores DECIMAL que llegan como texto desde MySQL', () => {
    assert.deepEqual(parametrosReorden({ demanda_promedio: '6.00', demanda_maxima: '10.00', tiempo_entrega: 2 }), {
      stock_seguridad: 8,
      punto_reorden: 20,
    });
  });
});

// Órdenes del ejercicio A3
const linea = (producto_id, cantidad, precio_unitario) => [{ producto_id, producto: `P${producto_id}`, cantidad, precio_unitario }];
const oc = (id, numero, fecha, proveedor_id, lineas, estado = 'recibida') => ({ id, numero, fecha, proveedor_id, proveedor: `Prov ${proveedor_id}`, estado, lineas });
const CEMENTO = 1;
const VARILLA = 2;
const A3 = [
  oc(1, 'OC-1041', '2026-10-02', 'A', linea(CEMENTO, 200, 6450)),
  oc(2, 'OC-1042', '2026-10-02', 'A', linea(CEMENTO, 200, 6450), 'aprobada'),
  oc(3, 'OC-1047', '2026-10-06', 'B', linea(CEMENTO, 40, 7100)),
  oc(4, 'OC-1050', '2026-10-08', 'C', linea(VARILLA, 500, 2150)),
  oc(5, 'OC-1053', '2026-10-09', 'C', linea(VARILLA, 480, 2150)),
  oc(6, 'OC-1058', '2026-10-13', 'D', linea(VARILLA, 60, 2600)),
  oc(7, 'OC-1061', '2026-10-15', 'A', linea(CEMENTO, 300, 6300)),
];
const pares = (r) => r.map((s) => `${s.orden_original.numero}/${s.posible_duplicado.numero}:${s.nivel}`);

describe('posibles compras duplicadas (ejercicio A3)', () => {
  test('con la regla por defecto encuentra OC-1041/OC-1042 (alta) y OC-1050/OC-1053 (media)', () => {
    const r = detectarDuplicados(A3);
    assert.deepEqual(pares(r), ['OC-1041/OC-1042:alta', 'OC-1050/OC-1053:media']);
    assert.equal(r[0].monto_en_riesgo, 1290000);
    assert.equal(r[1].coincidencias[0].diferencia_cantidad_pct, 4);
  });

  test('con tolerancia 0 % solo queda el duplicado exacto', () => {
    assert.deepEqual(pares(detectarDuplicados(A3, { tolerancia: 0 })), ['OC-1041/OC-1042:alta']);
  });

  test('con ventana de 0 días no se cruzan órdenes de días distintos', () => {
    assert.deepEqual(pares(detectarDuplicados(A3, { dias: 0 })), ['OC-1041/OC-1042:alta']);
  });

  test('mismo artículo pero distinto proveedor no es duplicado (OC-1041 vs OC-1047)', () => {
    assert.equal(detectarDuplicados([A3[0], A3[2]]).length, 0);
  });

  test('cantidades muy distintas no son duplicado (OC-1041 200 vs OC-1061 300)', () => {
    assert.equal(detectarDuplicados([A3[0], A3[6]], { dias: 30 }).length, 0);
  });

  test('misma cantidad pero varios días después se marca como media, no alta', () => {
    const r = detectarDuplicados([A3[0], oc(9, 'OC-2000', '2026-10-05', 'A', linea(CEMENTO, 200, 6450))]);
    assert.deepEqual(pares(r), ['OC-1041/OC-2000:media']);
  });

  test('la diferencia de días funciona al cambiar de mes', () => {
    assert.equal(diasEntre('2026-10-30', '2026-11-02'), 3);
  });
});

describe('forma de los movimientos', () => {
  const errores = (datos) => validarForma(datos).errores.map((e) => e.campo);

  test('entrada por compra válida toma el documento de la orden', () => {
    const { mov, errores: e } = validarForma({ tipo: 'entrada', producto_id: 1, cantidad: 5, bodega_destino_id: 1, orden_id: 3 });
    assert.deepEqual(e, []);
    assert.equal(mov.documento_tipo, 'orden_compra');
  });

  test('una entrada necesita destino y orden (o ser inventario inicial)', () => {
    assert.deepEqual(errores({ tipo: 'entrada', producto_id: 1, cantidad: 5 }), ['bodega_destino_id', 'orden_id']);
    assert.deepEqual(
      errores({ tipo: 'entrada', producto_id: 1, cantidad: 5, bodega_destino_id: 1, documento_tipo: 'inventario_inicial', documento_numero: 'INV-1' }),
      []
    );
  });

  test('una salida necesita origen, no destino, y su vale', () => {
    assert.deepEqual(errores({ tipo: 'salida', producto_id: 1, cantidad: 5, bodega_destino_id: 2 }), [
      'bodega_origen_id', 'bodega_destino_id', 'documento_numero',
    ]);
  });

  test('un traslado necesita dos bodegas distintas', () => {
    assert.deepEqual(errores({ tipo: 'traslado', producto_id: 1, cantidad: 5, bodega_origen_id: 1, bodega_destino_id: 1, documento_numero: 'BT-1' }), [
      'bodega_destino_id',
    ]);
  });

  test('un ajuste usa una sola bodega y exige motivo', () => {
    assert.deepEqual(errores({ tipo: 'ajuste', producto_id: 1, cantidad: 1, documento_numero: 'AJ-1' }), ['bodega_origen_id', 'observaciones']);
    assert.deepEqual(errores({ tipo: 'ajuste', producto_id: 1, cantidad: 1, bodega_destino_id: 1, documento_numero: 'AJ-1', observaciones: 'Sobrante en conteo' }), []);
  });

  test('solo las entradas por compra pueden llevar orden de compra', () => {
    assert.ok(errores({ tipo: 'salida', producto_id: 1, cantidad: 5, bodega_origen_id: 1, documento_numero: 'VS-1', orden_id: 4 }).includes('orden_id'));
  });

  test('el documento debe corresponder al tipo de movimiento', () => {
    assert.deepEqual(errores({ tipo: 'salida', producto_id: 1, cantidad: 5, bodega_origen_id: 1, documento_tipo: 'boleta_traslado', documento_numero: 'X' }), [
      'documento_tipo',
    ]);
  });
});

describe('revisión diaria programada', () => {
  test('calcula cuánto falta para la próxima ejecución', () => {
    const ahora = new Date(2026, 10, 9, 6, 30);
    assert.equal(msHasta('07:00', ahora), 30 * 60 * 1000);
    assert.equal(msHasta('06:30', ahora), 24 * 60 * 60 * 1000); // ya pasó: mañana
  });
});
