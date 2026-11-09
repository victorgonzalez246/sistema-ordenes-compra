const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { sequelize, Movimiento, Producto, Bodega, Usuario, OrdenCompra, Proveedor } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');
const { registrarMovimiento } = require('../services/inventario');
const { notificarAlerta } = require('../services/notificaciones');

const incluir = [
  { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] },
  { model: Bodega, as: 'bodega_origen', attributes: ['id', 'nombre'] },
  { model: Bodega, as: 'bodega_destino', attributes: ['id', 'nombre'] },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
  {
    model: OrdenCompra,
    as: 'orden',
    attributes: ['id', 'numero', 'fecha'],
    include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }],
  },
];

// GET /api/movimientos?producto_id=&bodega_id=&tipo=&orden_id=&desde=&hasta=
async function listar(req, res) {
  const { bodega_id, desde, hasta, ...filtros } = matchedData(req, { locations: ['query'] });
  const where = { ...filtros };
  if (bodega_id) where[Op.or] = [{ bodega_origen_id: bodega_id }, { bodega_destino_id: bodega_id }];
  if (desde || hasta) where.fecha = { ...(desde && { [Op.gte]: desde }), ...(hasta && { [Op.lte]: hasta }) };

  res.json(await Movimiento.findAll({ where, include: incluir, order: [['fecha', 'DESC'], ['id', 'DESC']] }));
}

// GET /api/movimientos/:id
async function obtener(req, res) {
  const movimiento = await Movimiento.findByPk(req.params.id, { include: incluir });
  if (!movimiento) throw new HttpError(404, `No existe un movimiento con id ${req.params.id}`);
  res.json(movimiento);
}

// POST /api/movimientos: registra el movimiento, recalcula el stock y evalúa la alerta de reorden
async function crear(req, res) {
  const datos = datosValidados(req);
  if (!datos.fecha) datos.fecha = new Date().toISOString().slice(0, 10);

  const resultado = await sequelize.transaction((transaction) =>
    registrarMovimiento(datos, { usuario_id: req.usuario.id, transaction })
  );
  const { accion, alerta, evaluacion } = resultado.alerta;
  if (accion) await notificarAlerta({ accion, alerta, producto: resultado.producto });

  const movimiento = await Movimiento.findByPk(resultado.movimiento.id, { include: incluir });
  res.status(201).json({
    movimiento,
    stock: evaluacion,
    alerta: accion ? { accion, id: alerta.id, prioridad: alerta.prioridad, estado: alerta.estado } : null,
  });
}

module.exports = { listar, obtener, crear };
