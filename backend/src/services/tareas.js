/**
 * Automatización del backend: revisión diaria programada.
 * (Es el equivalente al "Schedule Trigger" de n8n, pero dentro del propio servidor.)
 *
 * Cada día a la hora TAREAS_HORA (por defecto 07:00, hora del servidor):
 *   1. Recalcula la alerta de reorden de todos los materiales. Así se abren o cierran
 *      las alertas aunque no haya habido movimientos (por ejemplo, si cambió la demanda).
 *   2. Busca posibles compras duplicadas de los últimos DUPLICADOS_VENTANA días.
 *   3. Envía un resumen al webhook (si está configurado) y lo deja en la consola.
 *
 * Se desactiva con TAREAS_ACTIVAS=false. También se puede lanzar a mano con
 * POST /api/tareas/revision-diaria.
 */
const { sequelize, Producto } = require('../models');
const { evaluarAlerta } = require('./inventario');
const { enviarAviso, notificarAlerta } = require('./notificaciones');
const { buscarPosiblesDuplicados } = require('../controllers/duplicadosController');

const MS_DIA = 24 * 60 * 60 * 1000;
const colones = (n) => `₡${Number(n).toLocaleString('es-CR')}`;

let ultimaRevision = null;

async function revisionDiaria({ hoy = new Date() } = {}) {
  const inicio = Date.now();

  // 1. Reorden
  const productos = await Producto.findAll();
  const cambios = { abierta: 0, escalada: 0, actualizada: 0, cerrada: 0 };
  const bajo = [];
  for (const producto of productos) {
    const resultado = await sequelize.transaction((transaction) => evaluarAlerta(producto, { transaction }));
    if (resultado.accion) cambios[resultado.accion] += 1;
    if (['abierta', 'escalada'].includes(resultado.accion)) await notificarAlerta({ ...resultado, producto });
    if (['urgente', 'reponer'].includes(resultado.evaluacion.estado)) {
      bajo.push({ codigo: producto.codigo, nombre: producto.nombre, ...resultado.evaluacion });
    }
  }

  // 2. Duplicados recientes, o antiguos que todavía se pueden frenar (alguna orden sigue pendiente o aprobada)
  const ventana = Number(process.env.DUPLICADOS_VENTANA ?? 30);
  const desde = new Date(hoy.getTime() - ventana * MS_DIA).toISOString().slice(0, 10);
  const todos = await buscarPosiblesDuplicados();
  const abierta = (o) => ['pendiente', 'aprobada'].includes(o.estado);
  const sospechas = todos.sospechas.filter(
    (s) => s.posible_duplicado.fecha >= desde || abierta(s.orden_original) || abierta(s.posible_duplicado)
  );
  const duplicados = {
    total_sospechas: sospechas.length,
    monto_en_riesgo: Math.round(sospechas.reduce((t, s) => t + s.monto_en_riesgo, 0) * 100) / 100,
    sospechas,
  };

  // 3. Resumen
  const urgentes = bajo.filter((b) => b.estado === 'urgente').length;
  const lineas = [
    `📋 Revisión diaria de inventario (${hoy.toISOString().slice(0, 10)})`,
    `Materiales por reponer: ${bajo.length} (${urgentes} urgente(s))`,
    ...bajo.map((b) => `  • ${b.codigo} ${b.nombre}: stock ${b.stock}, PR ${b.punto_reorden}, pedir ${b.cantidad_sugerida}`),
    `Posibles compras duplicadas (últimos ${ventana} días u órdenes aún abiertas): ${duplicados.total_sospechas}` +
      (duplicados.total_sospechas ? `, monto en riesgo ${colones(duplicados.monto_en_riesgo)}` : ''),
    ...duplicados.sospechas.map(
      (s) =>
        `  • [${s.nivel}] ${s.orden_original.numero} / ${s.posible_duplicado.numero} ` +
        `(${s.posible_duplicado.numero} está ${s.posible_duplicado.estado}): ${s.motivo}`
    ),
  ];
  const texto = lineas.join('\n');
  const avisado = await enviarAviso(texto);

  ultimaRevision = {
    ejecutada_en: new Date().toISOString(),
    duracion_ms: Date.now() - inicio,
    alertas: cambios,
    por_reponer: bajo,
    duplicados: { desde, total: duplicados.total_sospechas, monto_en_riesgo: duplicados.monto_en_riesgo, sospechas: duplicados.sospechas },
    aviso_enviado: avisado,
    resumen: texto,
  };
  return ultimaRevision;
}

// Milisegundos que faltan para la próxima vez que el reloj marque "HH:MM"
function msHasta(hora, ahora = new Date()) {
  const [h, m] = hora.split(':').map(Number);
  const proxima = new Date(ahora);
  proxima.setHours(h, m, 0, 0);
  if (proxima <= ahora) proxima.setDate(proxima.getDate() + 1);
  return proxima - ahora;
}

async function ejecutarSinCaer() {
  try {
    const r = await revisionDiaria();
    console.log(`[tareas] Revisión diaria lista: ${r.por_reponer.length} por reponer, ${r.duplicados.total} posible(s) duplicado(s)`);
  } catch (error) {
    console.error('[tareas] La revisión diaria falló:', error.message);
  }
}

function iniciarTareas() {
  if (process.env.TAREAS_ACTIVAS === 'false') {
    console.log('[tareas] Revisión diaria desactivada (TAREAS_ACTIVAS=false)');
    return;
  }
  const hora = /^\d{2}:\d{2}$/.test(process.env.TAREAS_HORA || '') ? process.env.TAREAS_HORA : '07:00';
  setTimeout(() => {
    ejecutarSinCaer();
    setInterval(ejecutarSinCaer, MS_DIA);
  }, msHasta(hora));
  console.log(`[tareas] Revisión diaria programada todos los días a las ${hora}`);
}

module.exports = { revisionDiaria, iniciarTareas, msHasta, ultima: () => ultimaRevision };
