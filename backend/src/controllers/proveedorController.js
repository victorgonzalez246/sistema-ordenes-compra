const { matchedData } = require('express-validator');
const { Proveedor, OrdenCompra } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');

async function buscarOFallar(id) {
  const proveedor = await Proveedor.findByPk(id);
  if (!proveedor) throw new HttpError(404, `No existe un proveedor con id ${id}`);
  return proveedor;
}

// GET /api/proveedores
async function listar(req, res) {
  const proveedores = await Proveedor.findAll({ order: [['razon_social', 'ASC']] });
  res.json(proveedores);
}

// GET /api/proveedores/:id
async function obtener(req, res) {
  const proveedor = await buscarOFallar(req.params.id);
  res.json(proveedor);
}

// POST /api/proveedores
async function crear(req, res) {
  const datos = matchedData(req, { locations: ['body'] });
  const proveedor = await Proveedor.create(datos);
  res.status(201).json(proveedor);
}

// PUT /api/proveedores/:id
async function actualizar(req, res) {
  const proveedor = await buscarOFallar(req.params.id);
  const datos = matchedData(req, { locations: ['body'] });
  await proveedor.update(datos);
  res.json(proveedor);
}

// DELETE /api/proveedores/:id
async function eliminar(req, res) {
  const proveedor = await buscarOFallar(req.params.id);

  const ordenes = await OrdenCompra.count({ where: { proveedor_id: proveedor.id } });
  if (ordenes > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar el proveedor: tiene ${ordenes} orden(es) de compra asociada(s)`,
      [{ campo: 'id', mensaje: 'Puedes marcarlo como inactivo (activo: false) en lugar de eliminarlo' }]
    );
  }

  await proveedor.destroy();
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
