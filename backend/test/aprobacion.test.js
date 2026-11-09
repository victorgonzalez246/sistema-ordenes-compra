/**
 * Pruebas de la matriz de aprobación (Quiz #2, ejercicio A1). Funciones puras: sin MySQL.
 * Ejecutar: npm test  (o solo estas: node --test test/aprobacion.test.js)
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { nivelPara, permisoUsuario, evaluar } = require('../src/services/aprobacion');

const OBRAS = 1;
const MANTENIMIENTO = 2;
const orden = (total, extra = {}) => ({
  id: 99,
  total,
  fecha: '2026-11-04',
  departamento_id: OBRAS,
  lineas: [{ producto_id: 1, producto: 'Cemento' }],
  ...extra,
});
const usuario = (rol, departamento_id = null) => ({ rol, departamento_id });
const cotizaciones = (n) => new Map([[1, n]]);

describe('umbrales de la matriz', () => {
  test('cada monto cae en el nivel del enunciado (límites incluidos)', () => {
    assert.equal(nivelPara(250000).rol, 'jefatura_area');
    assert.equal(nivelPara(250000.01).rol, 'jefatura_compras');
    assert.equal(nivelPara(2000000).rol, 'jefatura_compras');
    assert.equal(nivelPara(2000001).rol, 'gerencia_financiera');
    assert.equal(nivelPara(10000000).rol, 'gerencia_financiera');
    assert.equal(nivelPara(10000001).rol, 'gerencia_general');
  });

  test('cotizaciones requeridas: 1, 2, 3 y 3 + comité', () => {
    assert.deepEqual([100, 300000, 5000000, 20000000].map((m) => nivelPara(m).cotizaciones), [1, 2, 3, 3]);
    assert.equal(nivelPara(20000000).comite, true);
    assert.equal(nivelPara(5000000).comite, false);
  });
});

describe('quién puede aprobar', () => {
  const requerido = (monto) => nivelPara(monto);

  test('un rol superior puede aprobar lo de uno inferior', () => {
    assert.equal(permisoUsuario(usuario('gerencia_general'), requerido(100000), OBRAS).puede, true);
    assert.equal(permisoUsuario(usuario('jefatura_compras'), requerido(100000), OBRAS).puede, true);
  });

  test('un rol inferior no puede aprobar un monto mayor', () => {
    const r = permisoUsuario(usuario('jefatura_compras'), requerido(3000000), OBRAS);
    assert.equal(r.puede, false);
    assert.match(r.motivo, /Gerencia Financiera/);
  });

  test('un solicitante no aprueba nada', () => {
    assert.equal(permisoUsuario(usuario('solicitante'), requerido(1000), OBRAS).puede, false);
  });

  test('la jefatura de área solo aprueba órdenes de su propio departamento', () => {
    assert.equal(permisoUsuario(usuario('jefatura_area', OBRAS), requerido(100000), OBRAS).puede, true);
    const ajeno = permisoUsuario(usuario('jefatura_area', MANTENIMIENTO), requerido(100000), OBRAS);
    assert.equal(ajeno.puede, false);
    assert.match(ajeno.motivo, /propio departamento/);
  });
});

describe('evaluación de una orden', () => {
  test('orden pequeña con su cotización: la aprueba la jefatura del área', () => {
    const r = evaluar({ orden: orden(200000), cotizacionesPorProducto: cotizaciones(1), usuario: usuario('jefatura_area', OBRAS) });
    assert.equal(r.requerido.rol, 'jefatura_area');
    assert.equal(r.se_puede_aprobar, true);
    assert.equal(r.fraccionamiento, false);
  });

  test('fraccionamiento: dos órdenes de ₡200 000 al mismo proveedor suman ₡400 000 y suben a Jefatura de Compras', () => {
    const r = evaluar({
      orden: orden(200000),
      relacionadas: [{ id: 1, numero: 'OC-1', fecha: '2026-11-01', estado: 'aprobada', total: 200000 }],
      cotizacionesPorProducto: cotizaciones(2),
      usuario: usuario('jefatura_area', OBRAS),
    });
    assert.equal(r.monto_evaluado, 400000);
    assert.equal(r.fraccionamiento, true);
    assert.equal(r.requerido.rol, 'jefatura_compras');
    assert.equal(r.usuario.puede_aprobar, false);
    assert.equal(r.se_puede_aprobar, false);
  });

  test('caso del enunciado: OC-1041 y OC-1042 (₡1 290 000 cada una) suman ₡2 580 000 → Gerencia Financiera', () => {
    const r = evaluar({
      orden: orden(1290000),
      relacionadas: [{ id: 1, numero: 'OC-1041', fecha: '2026-10-02', estado: 'recibida', total: 1290000 }],
      cotizacionesPorProducto: cotizaciones(3),
      usuario: usuario('jefatura_compras'),
    });
    assert.equal(r.nivel_por_monto.rol, 'jefatura_compras');
    assert.equal(r.requerido.rol, 'gerencia_financiera');
    assert.equal(r.usuario.puede_aprobar, false);
  });

  test('faltan cotizaciones: el rol alcanza pero la orden queda bloqueada', () => {
    const r = evaluar({ orden: orden(1000000), cotizacionesPorProducto: cotizaciones(1), usuario: usuario('gerencia_general') });
    assert.equal(r.usuario.puede_aprobar, true);
    assert.equal(r.se_puede_aprobar, false);
    assert.equal(r.bloqueos[0].campo, 'cotizaciones');
    assert.match(r.bloqueos[0].mensaje, /tiene 1 .* se requieren 2/);
  });

  test('más de ₡10 000 000 exige el acta del comité', () => {
    const base = { orden: orden(12000000), cotizacionesPorProducto: cotizaciones(3), usuario: usuario('gerencia_general') };
    assert.deepEqual(evaluar(base).bloqueos.map((b) => b.campo), ['acta_comite']);
    assert.equal(evaluar({ ...base, actaComite: 'ACTA-2026-07' }).se_puede_aprobar, true);
  });

  test('cada producto de la orden necesita sus propias cotizaciones', () => {
    const r = evaluar({
      orden: orden(300000, { lineas: [{ producto_id: 1, producto: 'Cemento' }, { producto_id: 2, producto: 'Varilla' }] }),
      cotizacionesPorProducto: new Map([[1, 2]]),
      usuario: usuario('gerencia_general'),
    });
    assert.deepEqual(r.cotizaciones.map((c) => c.cumple), [true, false]);
    assert.equal(r.bloqueos.length, 1);
  });
});
