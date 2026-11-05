/**
 * Pruebas del asistente multiagente con un cliente SIMULADO: no llaman a la API de
 * Anthropic, no necesitan ANTHROPIC_API_KEY y no gastan dinero. Sí leen la base de datos
 * real, así que requieren MySQL encendido y los datos de ejemplo (npm run seed).
 *
 * Ejecutar: npm test
 */
require('dotenv').config({ quiet: true });
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { responder } = require('../src/asistente/agentes');
const { limiteUso } = require('../src/middlewares/limiteUso');
const { sequelize } = require('../src/models');

after(() => sequelize.close());

let ids = 0;
const uso = (name, input) => ({ type: 'tool_use', id: `toolu_${++ids}`, name, input });
const usage = { input_tokens: 100, output_tokens: 50 };
const esCerebro = (params) => params.system.startsWith('Eres el cerebro');
const ultimoMensaje = (params) => params.messages[params.messages.length - 1];
const traeResultados = (params) => {
  const u = ultimoMensaje(params);
  return Array.isArray(u.content) && u.content[0]?.type === 'tool_result';
};

// Cliente simulado: el cerebro delega en Inventario y Finanzas a la vez; cada agente consulta una herramienta
function clienteNormal(registro = []) {
  return {
    beta: {
      messages: {
        async create(params) {
          registro.push(params);
          if (esCerebro(params)) {
            if (!traeResultados(params)) {
              return { stop_reason: 'tool_use', usage, content: [
                uso('delegar_inventario', { tarea: 'Productos bajo el mínimo' }),
                uso('delegar_finanzas', { tarea: 'Facturas con saldo' }),
              ] };
            }
            const informes = ultimoMensaje(params).content.map((r) => r.content).join(' | ');
            return { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: `Resumen: ${informes}` }] };
          }
          const inventario = params.system.includes('Inventario');
          if (!traeResultados(params)) {
            return { stop_reason: 'tool_use', usage, content: [
              inventario ? uso('listar_existencias', { solo_bajo_minimo: true }) : uso('listar_facturas', { estado: 'pendiente' }),
            ] };
          }
          const filas = JSON.parse(ultimoMensaje(params).content[0].content);
          return { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: `${inventario ? 'INV' : 'FIN'}:${filas.length}` }] };
        },
      },
    },
  };
}

async function correr(cliente, pregunta = '¿Qué debo reponer y pagar?') {
  const eventos = [];
  let error = null;
  try {
    await responder({ cliente, pregunta, emitir: (e) => eventos.push(e) });
  } catch (e) {
    error = e;
  }
  return { eventos, error, tipos: eventos.map((e) => e.tipo) };
}

test('el cerebro delega en paralelo, los agentes consultan MySQL y la respuesta combina sus informes', async () => {
  const llamadas = [];
  const { eventos, error } = await correr(clienteNormal(llamadas));
  assert.equal(error, null);

  const delegados = eventos.filter((e) => e.tipo === 'delegar').map((e) => e.agente).sort();
  assert.deepEqual(delegados, ['finanzas', 'inventario']);

  // Ambas delegaciones ocurren antes de que cualquier agente responda (trabajo en paralelo)
  const ultimaDelegacion = eventos.map((e) => e.tipo).lastIndexOf('delegar');
  const primeraRespuesta = eventos.findIndex((e) => e.tipo === 'agente_responde');
  assert.ok(ultimaDelegacion < primeraRespuesta);

  // Los agentes leyeron datos reales de la base
  const lecturas = eventos.filter((e) => e.tipo === 'herramienta_lista');
  assert.equal(lecturas.length, 2);
  lecturas.forEach((l) => assert.ok(l.filas >= 1, `${l.herramienta} debería devolver filas del seed`));

  const respuesta = eventos.find((e) => e.tipo === 'respuesta');
  assert.match(respuesta.texto, /INV:\d+/);
  assert.match(respuesta.texto, /FIN:\d+/);

  // 2 llamadas del cerebro + 2 por cada agente
  assert.equal(llamadas.length, 6);
});

test('cada agente recibe solo sus propias herramientas y el modelo configurado', async () => {
  const llamadas = [];
  await correr(clienteNormal(llamadas));
  const nombres = (p) => p.tools.map((t) => t.name).sort();
  const cerebro = llamadas.find(esCerebro);
  const inventario = llamadas.find((p) => p.system.includes('Agente de Inventario'));
  const finanzas = llamadas.find((p) => p.system.includes('Agente de Finanzas'));

  assert.deepEqual(nombres(cerebro), ['delegar_compras', 'delegar_finanzas', 'delegar_inventario']);
  assert.deepEqual(nombres(inventario), ['listar_bodegas', 'listar_existencias', 'listar_recepciones']);
  assert.deepEqual(nombres(finanzas), ['gasto_por_departamento', 'listar_facturas', 'listar_pagos']);
  llamadas.forEach((p) => {
    assert.equal(p.fallbacks, 'default');
    assert.ok(p.betas.includes('server-side-fallback-2026-07-01'));
  });
});

test('informa el consumo de tokens y el costo estimado de toda la pregunta', async () => {
  const { eventos } = await correr(clienteNormal());
  const consumo = eventos.find((e) => e.tipo === 'consumo');
  assert.ok(consumo, 'debe emitir un evento de consumo');
  assert.equal(consumo.llamadas, 6);
  assert.equal(consumo.entrada, 600);
  assert.equal(consumo.salida, 300);
  if (consumo.modelo === 'claude-opus-5-5') assert.equal(consumo.costo_usd, 0.0084); // 600×$4 + 300×$20 por millón
});

test('los agentes solo leen: la base de datos no cambia', async () => {
  const tablas = ['ordenes_compra', 'facturas', 'pagos', 'existencias', 'requisiciones', 'proveedores', 'usuarios'];
  const contar = async () =>
    Object.fromEntries(await Promise.all(tablas.map(async (t) => {
      const [[fila]] = await sequelize.query(`SELECT COUNT(*) AS n FROM ${t}`);
      return [t, Number(fila.n)];
    })));
  const antes = await contar();
  await correr(clienteNormal());
  assert.deepEqual(await contar(), antes);
});

test('si el modelo pide una herramienta que no existe, recibe un error y el flujo continúa', async () => {
  const cliente = {
    beta: { messages: { async create(params) {
      if (esCerebro(params)) {
        if (!traeResultados(params)) return { stop_reason: 'tool_use', usage, content: [uso('delegar_compras', { tarea: 'x' })] };
        return { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: 'listo' }] };
      }
      if (!traeResultados(params)) return { stop_reason: 'tool_use', usage, content: [uso('borrar_todo', {})] };
      const resultado = ultimoMensaje(params).content[0];
      assert.equal(resultado.is_error, true);
      assert.match(resultado.content, /Herramienta desconocida/);
      return { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: 'no pude' }] };
    } } },
  };
  const { tipos, error } = await correr(cliente);
  assert.equal(error, null);
  assert.ok(tipos.includes('respuesta'));
});

test('un rechazo del modelo se informa como un error claro', async () => {
  const cliente = { beta: { messages: { async create() {
    return { stop_reason: 'refusal', usage, content: [] };
  } } } };
  const { error } = await correr(cliente);
  assert.ok(error?.esRechazo);
  assert.match(error.message, /políticas de uso/);
});

test('el cerebro no entra en un ciclo infinito: se detiene tras el máximo de vueltas', async () => {
  let llamadasCerebro = 0;
  const cliente = { beta: { messages: { async create(params) {
    if (esCerebro(params)) {
      llamadasCerebro += 1;
      return { stop_reason: 'tool_use', usage, content: [uso('delegar_compras', { tarea: 'otra vez' })] };
    }
    return { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: 'informe' }] };
  } } } };
  const { eventos } = await correr(cliente);
  assert.equal(llamadasCerebro, 6);
  assert.match(eventos.find((e) => e.tipo === 'respuesta').texto, /número de pasos/);
});

test('el límite de uso responde 429 al superar el máximo', () => {
  const limitar = limiteUso({ maximo: 2, ventanaMs: 60000, clave: () => 'cliente', mensaje: 'Límite' });
  const respuestas = [];
  const res = {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.codigo = c; return this; },
    json(cuerpo) { respuestas.push({ codigo: this.codigo, cuerpo, reintentar: this.headers['Retry-After'] }); },
  };
  let pasaron = 0;
  for (let i = 0; i < 3; i += 1) limitar({}, res, () => { pasaron += 1; });
  assert.equal(pasaron, 2);
  assert.equal(respuestas[0].codigo, 429);
  assert.equal(respuestas[0].cuerpo.error, 'Límite');
  assert.ok(Number(respuestas[0].reintentar) > 0);
});
