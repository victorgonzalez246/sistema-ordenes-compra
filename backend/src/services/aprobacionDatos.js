const { Op } = require('sequelize');
const { OrdenCompra, DetalleOrden, Producto, Cotizacion } = require('../models');
const { evaluar } = require('./aprobacion');

const MS_DIA = 24 * 60 * 60 * 1000;

function sumarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d) + dias * MS_DIA).toISOString().slice(0, 10);
}

/**
 * Carga lo necesario para evaluar una orden contra la matriz de aprobación:
 * órdenes del mismo departamento y proveedor en la ventana de días (contra el fraccionamiento)
 * y cuántos proveedores distintos cotizaron cada producto con vigencia en la fecha de la orden.
 */
async function evaluarOrden(ordenId, { usuario, actaComite, transaction } = {}) {
  const orden = await OrdenCompra.findByPk(ordenId, {
    include: [{ model: DetalleOrden, as: 'detalles', include: [{ model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre'] }] }],
    transaction,
  });
  if (!orden) return null;

  const ventana = Number(process.env.APROBACION_VENTANA_DIAS ?? 30);
  const relacionadas = await OrdenCompra.findAll({
    where: {
      id: { [Op.ne]: orden.id },
      departamento_id: orden.departamento_id,
      proveedor_id: orden.proveedor_id,
      estado: { [Op.ne]: 'anulada' },
      fecha: { [Op.between]: [sumarDias(orden.fecha, -ventana), sumarDias(orden.fecha, ventana)] },
    },
    order: [['fecha', 'ASC']],
    transaction,
  });

  const productoIds = [...new Set(orden.detalles.map((d) => d.producto_id))];
  const cotizaciones = await Cotizacion.findAll({
    where: {
      producto_id: productoIds,
      fecha: { [Op.lte]: orden.fecha },
      vigencia_hasta: { [Op.gte]: orden.fecha },
    },
    attributes: ['producto_id', 'proveedor_id'],
    transaction,
  });
  const proveedoresPorProducto = new Map();
  for (const c of cotizaciones) {
    if (!proveedoresPorProducto.has(c.producto_id)) proveedoresPorProducto.set(c.producto_id, new Set());
    proveedoresPorProducto.get(c.producto_id).add(c.proveedor_id);
  }
  const cotizacionesPorProducto = new Map([...proveedoresPorProducto.entries()].map(([id, s]) => [id, s.size]));

  const evaluacion = evaluar({
    orden: {
      id: orden.id,
      total: orden.total,
      fecha: orden.fecha,
      departamento_id: orden.departamento_id,
      lineas: orden.detalles.map((d) => ({ producto_id: d.producto_id, producto: `${d.producto.codigo} · ${d.producto.nombre}` })),
    },
    relacionadas,
    cotizacionesPorProducto,
    usuario,
    actaComite,
  });
  return { orden, evaluacion, ventana_dias: ventana };
}

module.exports = { evaluarOrden };
