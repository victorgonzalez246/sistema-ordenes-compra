const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { OrdenCompra, DetalleOrden, Producto, Proveedor, Departamento } = require('../models');
const { detectarDuplicados } = require('../services/duplicados');

// Valores por defecto de la regla, configurables en .env
const reglaPorDefecto = () => ({
  dias: Number(process.env.DUPLICADOS_DIAS ?? 7),
  tolerancia: Number(process.env.DUPLICADOS_TOLERANCIA ?? 10),
});

/**
 * GET /api/ordenes/posibles-duplicados?dias=7&tolerancia=10&desde=&hasta=
 * Órdenes sospechosas según la regla de services/duplicados.js. Las órdenes anuladas no cuentan.
 */
async function posiblesDuplicados(req, res) {
  res.json(await buscarPosiblesDuplicados(matchedData(req, { locations: ['query'] })));
}

// También la usa la revisión diaria automática (services/tareas.js)
async function buscarPosiblesDuplicados(filtros = {}) {
  const { dias, tolerancia, desde, hasta } = { ...reglaPorDefecto(), ...filtros };

  const where = { estado: { [Op.ne]: 'anulada' } };
  if (desde || hasta) where.fecha = { ...(desde && { [Op.gte]: desde }), ...(hasta && { [Op.lte]: hasta }) };

  const ordenes = await OrdenCompra.findAll({
    where,
    include: [
      { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] },
      { model: Departamento, as: 'departamento', attributes: ['id', 'nombre'] },
      {
        model: DetalleOrden,
        as: 'detalles',
        include: [{ model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre'] }],
      },
    ],
  });

  const datos = ordenes.map((o) => ({
    id: o.id,
    numero: o.numero,
    fecha: o.fecha,
    estado: o.estado,
    proveedor_id: o.proveedor_id,
    proveedor: o.proveedor?.razon_social,
    departamento: o.departamento?.nombre,
    lineas: o.detalles.map((d) => ({
      producto_id: d.producto_id,
      producto: `${d.producto.codigo} · ${d.producto.nombre}`,
      cantidad: d.cantidad,
      precio_unitario: Number(d.precio_unitario),
    })),
  }));

  const sospechosas = detectarDuplicados(datos, { dias, tolerancia });
  return {
    regla: {
      dias,
      tolerancia,
      descripcion:
        `Mismo proveedor, mismo artículo, cantidad con diferencia de ${tolerancia} % o menos ` +
        `y fechas a ${dias} día(s) o menos. Se excluyen las órdenes anuladas.`,
    },
    ordenes_revisadas: datos.length,
    total_sospechas: sospechosas.length,
    monto_en_riesgo: Math.round(sospechosas.reduce((s, x) => s + x.monto_en_riesgo, 0) * 100) / 100,
    sospechas: sospechosas,
  };
}

module.exports = { posiblesDuplicados, buscarPosiblesDuplicados };
