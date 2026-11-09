const { sequelize, Recepcion, OrdenCompra, Bodega, Empleado, Movimiento, Producto } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias } = require('./reglas');
const { datosValidados } = require('../validators/comunes');
const { registrarMovimiento } = require('../services/inventario');
const { notificarAlerta } = require('../services/notificaciones');

const incluir = [
  { model: OrdenCompra, as: 'orden', attributes: ['id', 'numero', 'estado'] },
  { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
  { model: Empleado, as: 'empleado', attributes: ['id', 'nombre'] },
  {
    model: Movimiento,
    as: 'movimientos',
    attributes: ['id', 'cantidad', 'fecha'],
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] }],
  },
];

async function validarRecepcion(datos, actual) {
  const { orden_id: orden } = await verificarReferencias(datos, [
    { campo: 'orden_id', Modelo: OrdenCompra, nombre: 'una orden de compra' },
    { campo: 'bodega_id', Modelo: Bodega, nombre: 'una bodega', activo: 'La bodega está inactiva' },
    { campo: 'empleado_id', Modelo: Empleado, nombre: 'un empleado', activo: 'El empleado está inactivo' },
  ]);

  // Solo llega mercancía de órdenes aprobadas (o ya recibidas, si es una entrega parcial)
  if (orden && !['aprobada', 'recibida'].includes(orden.estado)) {
    throw new HttpError(400, `No se puede registrar una recepción para una orden ${orden.estado}`, [
      { campo: 'orden_id', mensaje: 'La orden debe estar aprobada o recibida' },
    ]);
  }

  // Si la recepción ya movió inventario, no se puede cambiar de orden ni de bodega
  if (actual && (datos.orden_id !== undefined || datos.bodega_id !== undefined)) {
    const movimientos = await Movimiento.count({ where: { recepcion_id: actual.id } });
    const cambia = (datos.orden_id ?? actual.orden_id) !== actual.orden_id || (datos.bodega_id ?? actual.bodega_id) !== actual.bodega_id;
    if (movimientos > 0 && cambia) {
      throw new HttpError(409, 'La recepción ya registró entradas de inventario: no se puede cambiar la orden ni la bodega');
    }
  }
}

const base = crearControladorCrud(Recepcion, {
  articulo: 'una recepción',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir,
  antesDeGuardar: validarRecepcion,
  async antesDeEliminar(recepcion) {
    const movimientos = await Movimiento.count({ where: { recepcion_id: recepcion.id } });
    if (movimientos > 0) {
      throw new HttpError(409, `No se puede eliminar la recepción: generó ${movimientos} entrada(s) de inventario. Corrija con un ajuste.`);
    }
  },
});

/**
 * POST /api/recepciones
 * Con "lineas" registra en la misma transacción una entrada de inventario por material,
 * ligada a la orden y a la recepción (trazabilidad). Sin "lineas" solo guarda la recepción.
 */
async function crear(req, res) {
  const { lineas = [], ...datos } = datosValidados(req);
  await validarRecepcion(datos, null);

  const { id, alertas } = await sequelize.transaction(async (transaction) => {
    const recepcion = await Recepcion.create(datos, { transaction });
    const avisos = [];
    for (const linea of lineas) {
      const { alerta, producto } = await registrarMovimiento(
        {
          tipo: 'entrada',
          fecha: recepcion.fecha,
          producto_id: linea.producto_id,
          cantidad: linea.cantidad,
          bodega_destino_id: recepcion.bodega_id,
          documento_tipo: 'orden_compra',
          orden_id: recepcion.orden_id,
          recepcion_id: recepcion.id,
          observaciones: recepcion.observaciones,
        },
        { usuario_id: req.usuario.id, transaction }
      );
      if (alerta.accion) avisos.push({ ...alerta, producto });
    }
    return { id: recepcion.id, alertas: avisos };
  });

  for (const aviso of alertas) await notificarAlerta(aviso);
  res.status(201).json(await Recepcion.findByPk(id, { include: incluir }));
}

module.exports = { ...base, crear };
