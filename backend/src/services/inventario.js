const { QueryTypes } = require('sequelize');
const {
  sequelize,
  Producto,
  Bodega,
  Existencia,
  Movimiento,
  OrdenCompra,
  DetalleOrden,
  AlertaReorden,
} = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { evaluarReorden } = require('./reorden');

// Documentos válidos para cada tipo de movimiento (el primero es el valor por defecto)
const DOCUMENTOS_POR_TIPO = {
  entrada: ['orden_compra', 'inventario_inicial'],
  salida: ['vale_salida'],
  traslado: ['boleta_traslado'],
  ajuste: ['ajuste_inventario'],
};

const hay = (v) => v !== undefined && v !== null;

/**
 * Revisa que un movimiento tenga la forma correcta según su tipo. Función pura.
 * Devuelve los datos completados (documento por defecto) y la lista de errores.
 */
function validarForma(datos) {
  const errores = [];
  const mov = { ...datos };
  const { tipo } = mov;
  const origen = hay(mov.bodega_origen_id);
  const destino = hay(mov.bodega_destino_id);
  const error = (campo, mensaje) => errores.push({ campo, mensaje });

  if (!DOCUMENTOS_POR_TIPO[tipo]) {
    error('tipo', `El tipo debe ser uno de: ${Object.keys(DOCUMENTOS_POR_TIPO).join(', ')}`);
    return { mov, errores };
  }

  if (tipo === 'entrada') {
    if (!destino) error('bodega_destino_id', 'Una entrada necesita la bodega u obra que recibe');
    if (origen) error('bodega_origen_id', 'Una entrada no tiene bodega de origen');
  }
  if (tipo === 'salida') {
    if (!origen) error('bodega_origen_id', 'Una salida necesita la bodega u obra de donde sale');
    if (destino) error('bodega_destino_id', 'Una salida no tiene bodega de destino; para mover material use un traslado');
  }
  if (tipo === 'traslado') {
    if (!origen) error('bodega_origen_id', 'Un traslado necesita bodega de origen');
    if (!destino) error('bodega_destino_id', 'Un traslado necesita bodega de destino');
    if (origen && destino && mov.bodega_origen_id === mov.bodega_destino_id) {
      error('bodega_destino_id', 'El origen y el destino de un traslado deben ser distintos');
    }
  }
  if (tipo === 'ajuste') {
    if (origen === destino) {
      error('bodega_origen_id', 'Un ajuste usa solo una bodega: origen si falta material, destino si sobra');
    }
    if (!mov.observaciones) error('observaciones', 'Un ajuste debe explicar el motivo en las observaciones');
  }

  // Documento de origen
  if (!hay(mov.documento_tipo)) mov.documento_tipo = DOCUMENTOS_POR_TIPO[tipo][0];
  if (!DOCUMENTOS_POR_TIPO[tipo].includes(mov.documento_tipo)) {
    error('documento_tipo', `Para un movimiento de tipo ${tipo} el documento debe ser: ${DOCUMENTOS_POR_TIPO[tipo].join(' o ')}`);
  }
  if (mov.documento_tipo === 'orden_compra' && !hay(mov.orden_id)) {
    error('orden_id', 'Una entrada por compra debe indicar la orden de compra de donde proviene');
  }
  if (hay(mov.orden_id) && mov.documento_tipo !== 'orden_compra') {
    error('orden_id', 'Solo las entradas por compra se asocian a una orden de compra');
  }
  if (mov.documento_tipo !== 'orden_compra' && !mov.documento_numero) {
    error('documento_numero', 'Indique el número del documento (vale de salida, boleta, acta de conteo...)');
  }

  return { mov, errores };
}

// Stock por material y bodega calculado desde los movimientos
async function stockPorBodega({ producto_id, bodega_id, transaction } = {}) {
  const filtros = [];
  if (producto_id) filtros.push('producto_id = :producto_id');
  if (bodega_id) filtros.push('bodega_id = :bodega_id');
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const filas = await sequelize.query(
    `SELECT producto_id, bodega_id, SUM(delta) AS cantidad
       FROM (
         SELECT producto_id, bodega_destino_id AS bodega_id, cantidad AS delta
           FROM movimientos WHERE bodega_destino_id IS NOT NULL
         UNION ALL
         SELECT producto_id, bodega_origen_id AS bodega_id, -cantidad AS delta
           FROM movimientos WHERE bodega_origen_id IS NOT NULL
       ) m
     ${where}
     GROUP BY producto_id, bodega_id`,
    { replacements: { producto_id, bodega_id }, type: QueryTypes.SELECT, transaction }
  );
  return filas.map((f) => ({ producto_id: f.producto_id, bodega_id: f.bodega_id, cantidad: Number(f.cantidad) }));
}

// Stock total de cada material (todas las bodegas): Map producto_id -> cantidad
async function stockTotales({ producto_id, transaction } = {}) {
  const totales = new Map();
  for (const f of await stockPorBodega({ producto_id, transaction })) {
    totales.set(f.producto_id, (totales.get(f.producto_id) || 0) + f.cantidad);
  }
  return totales;
}

async function saldo(producto_id, bodega_id, transaction) {
  const [fila] = await stockPorBodega({ producto_id, bodega_id, transaction });
  return fila ? fila.cantidad : 0;
}

// Bloquea la fila de existencia (producto, bodega) para que dos movimientos simultáneos no se pisen
async function bloquearExistencia(producto_id, bodega_id, transaction) {
  await Existencia.findOrCreate({
    where: { producto_id, bodega_id },
    defaults: { cantidad: 0, minimo: 0 },
    transaction,
  });
  return Existencia.findOne({ where: { producto_id, bodega_id }, lock: transaction.LOCK.UPDATE, transaction });
}

// Cantidad pedida y ya recibida de un material en una orden
async function avanceOrden(orden_id, producto_id, transaction) {
  const [pedida, recibida] = await Promise.all([
    DetalleOrden.sum('cantidad', { where: { orden_id, producto_id }, transaction }),
    Movimiento.sum('cantidad', { where: { orden_id, producto_id, tipo: 'entrada' }, transaction }),
  ]);
  return { pedida: pedida || 0, recibida: recibida || 0 };
}

async function validarOrden(mov, transaction) {
  const orden = await OrdenCompra.findByPk(mov.orden_id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!orden) throw new HttpError(400, 'Datos no válidos', [{ campo: 'orden_id', mensaje: `No existe una orden de compra con id ${mov.orden_id}` }]);
  if (!['aprobada', 'recibida'].includes(orden.estado)) {
    throw new HttpError(409, `No se puede recibir mercancía de una orden ${orden.estado}`, [
      { campo: 'orden_id', mensaje: 'La orden debe estar aprobada' },
    ]);
  }

  const { pedida, recibida } = await avanceOrden(orden.id, mov.producto_id, transaction);
  if (pedida === 0) {
    throw new HttpError(409, `El material no está incluido en la orden ${orden.numero}`, [
      { campo: 'producto_id', mensaje: 'Solo se recibe lo que se pidió en la orden' },
    ]);
  }
  if (recibida + mov.cantidad > pedida) {
    throw new HttpError(409, `La orden ${orden.numero} pidió ${pedida} y ya se recibieron ${recibida}: solo faltan ${pedida - recibida}`, [
      { campo: 'cantidad', mensaje: `Máximo pendiente de recibir: ${pedida - recibida}` },
    ]);
  }
  return orden;
}

// Pasa la orden a "recibida" cuando ya llegaron todas sus líneas
async function cerrarOrdenSiCompleta(orden, transaction) {
  if (orden.estado !== 'aprobada') return;
  const lineas = await DetalleOrden.findAll({ where: { orden_id: orden.id }, transaction });
  for (const producto_id of new Set(lineas.map((l) => l.producto_id))) {
    const { pedida, recibida } = await avanceOrden(orden.id, producto_id, transaction);
    if (recibida < pedida) return;
  }
  await orden.update({ estado: 'recibida' }, { transaction });
}

/**
 * Abre, actualiza o cierra la alerta de reorden de un material según su stock total.
 * Devuelve { accion: 'abierta' | 'actualizada' | 'cerrada' | null, alerta, evaluacion }.
 */
async function evaluarAlerta(producto, { movimiento_id = null, transaction } = {}) {
  const totales = await stockTotales({ producto_id: producto.id, transaction });
  const evaluacion = evaluarReorden(producto, totales.get(producto.id) || 0);
  const abierta = await AlertaReorden.findOne({
    where: { producto_id: producto.id, estado: 'abierta' },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  const bajo = ['urgente', 'reponer'].includes(evaluacion.estado);
  const datos = {
    stock: evaluacion.stock,
    prioridad: evaluacion.estado,
    punto_reorden: evaluacion.punto_reorden,
    cantidad_sugerida: evaluacion.cantidad_sugerida,
  };

  if (bajo && !abierta) {
    const alerta = await AlertaReorden.create({ ...datos, producto_id: producto.id, movimiento_id }, { transaction });
    return { accion: 'abierta', alerta, evaluacion };
  }
  if (bajo && abierta) {
    const escalo = abierta.prioridad === 'reponer' && datos.prioridad === 'urgente';
    await abierta.update(datos, { transaction });
    return { accion: escalo ? 'escalada' : 'actualizada', alerta: abierta, evaluacion };
  }
  if (!bajo && abierta) {
    await abierta.update({ estado: 'cerrada', cerrada_en: new Date(), stock: evaluacion.stock }, { transaction });
    return { accion: 'cerrada', alerta: abierta, evaluacion };
  }
  return { accion: null, alerta: null, evaluacion };
}

/**
 * Registra un movimiento dentro de una transacción ya abierta:
 * valida la forma y las referencias, verifica que haya stock, guarda el movimiento,
 * actualiza la tabla de existencias, cierra la orden si ya se recibió completa
 * y evalúa la alerta de reorden del material.
 */
async function registrarMovimiento(datos, { usuario_id, transaction }) {
  if (!transaction) throw new Error('registrarMovimiento necesita una transacción');

  const { mov, errores } = validarForma(datos);
  if (errores.length) throw new HttpError(400, 'El movimiento no es válido', errores);

  const producto = await Producto.findByPk(mov.producto_id, { transaction });
  if (!producto) throw new HttpError(400, 'Datos no válidos', [{ campo: 'producto_id', mensaje: `No existe un material con id ${mov.producto_id}` }]);

  const bodegas = {};
  for (const campo of ['bodega_origen_id', 'bodega_destino_id']) {
    if (!hay(mov[campo])) continue;
    const bodega = await Bodega.findByPk(mov[campo], { transaction });
    if (!bodega) throw new HttpError(400, 'Datos no válidos', [{ campo, mensaje: `No existe una bodega con id ${mov[campo]}` }]);
    // De una bodega inactiva se puede sacar material, pero no meterle
    if (campo === 'bodega_destino_id' && !bodega.activa) {
      throw new HttpError(409, `La bodega ${bodega.nombre} está inactiva y no puede recibir material`, [{ campo, mensaje: 'Bodega inactiva' }]);
    }
    bodegas[campo] = bodega;
  }

  let orden = null;
  if (mov.documento_tipo === 'orden_compra') {
    orden = await validarOrden(mov, transaction);
    mov.documento_numero = orden.numero;
  }

  // Se bloquean las existencias en orden de id para evitar bloqueos cruzados
  const afectadas = [mov.bodega_origen_id, mov.bodega_destino_id].filter(hay).sort((a, b) => a - b);
  const existencias = {};
  for (const bodega_id of afectadas) {
    existencias[bodega_id] = await bloquearExistencia(producto.id, bodega_id, transaction);
  }

  if (hay(mov.bodega_origen_id)) {
    const disponible = await saldo(producto.id, mov.bodega_origen_id, transaction);
    if (disponible < mov.cantidad) {
      throw new HttpError(409, `Stock insuficiente de ${producto.nombre} en ${bodegas.bodega_origen_id.nombre}: hay ${disponible} y se piden ${mov.cantidad}`, [
        { campo: 'cantidad', mensaje: `Disponible: ${disponible}` },
      ]);
    }
  }

  const movimiento = await Movimiento.create(
    {
      tipo: mov.tipo,
      fecha: mov.fecha,
      cantidad: mov.cantidad,
      producto_id: producto.id,
      bodega_origen_id: mov.bodega_origen_id ?? null,
      bodega_destino_id: mov.bodega_destino_id ?? null,
      documento_tipo: mov.documento_tipo,
      documento_numero: mov.documento_numero,
      orden_id: mov.orden_id ?? null,
      recepcion_id: mov.recepcion_id ?? null,
      observaciones: mov.observaciones ?? null,
      usuario_id,
    },
    { transaction }
  );

  // La tabla de existencias es un resumen: siempre se reescribe con el saldo de los movimientos
  for (const bodega_id of afectadas) {
    await existencias[bodega_id].update({ cantidad: await saldo(producto.id, bodega_id, transaction) }, { transaction });
  }

  if (orden) await cerrarOrdenSiCompleta(orden, transaction);

  const alerta = await evaluarAlerta(producto, { movimiento_id: movimiento.id, transaction });
  return { movimiento, alerta, producto };
}

module.exports = {
  DOCUMENTOS_POR_TIPO,
  validarForma,
  stockPorBodega,
  stockTotales,
  evaluarAlerta,
  registrarMovimiento,
  avanceOrden,
};
