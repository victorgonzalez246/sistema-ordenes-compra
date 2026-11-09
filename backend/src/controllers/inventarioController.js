const { matchedData } = require('express-validator');
const {
  Producto,
  Bodega,
  Movimiento,
  Usuario,
  OrdenCompra,
  DetalleOrden,
  Proveedor,
  Recepcion,
  AlertaReorden,
  Categoria,
} = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { stockPorBodega, stockTotales } = require('../services/inventario');
const { evaluarReorden, compararPrioridad } = require('../services/reorden');

const atributosMaterial = [
  'id', 'codigo', 'nombre', 'unidad', 'precio_ref', 'stock_minimo', 'stock_maximo',
  'demanda_promedio', 'demanda_maxima', 'tiempo_entrega',
];

async function buscarMaterial(id) {
  const producto = await Producto.findByPk(id, {
    include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
  });
  if (!producto) throw new HttpError(404, `No existe un material con id ${id}`);
  return producto;
}

async function nombresBodegas() {
  const bodegas = await Bodega.findAll({ attributes: ['id', 'nombre', 'activa'] });
  return new Map(bodegas.map((b) => [b.id, b]));
}

function parametros(p) {
  return {
    stock_minimo: p.stock_minimo,
    stock_maximo: p.stock_maximo,
    demanda_promedio: p.demanda_promedio,
    demanda_maxima: p.demanda_maxima,
    tiempo_entrega: p.tiempo_entrega,
  };
}

// GET /api/productos/:id/stock → stock actual (por bodega y total), SS, PR y estado
async function stock(req, res) {
  const producto = await buscarMaterial(req.params.id);
  const [filas, bodegas] = await Promise.all([stockPorBodega({ producto_id: producto.id }), nombresBodegas()]);

  const por_bodega = filas
    .filter((f) => f.cantidad !== 0)
    .map((f) => ({ bodega_id: f.bodega_id, bodega: bodegas.get(f.bodega_id)?.nombre, cantidad: f.cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
  const total = filas.reduce((s, f) => s + f.cantidad, 0);

  res.json({
    material: { id: producto.id, codigo: producto.codigo, nombre: producto.nombre, unidad: producto.unidad },
    parametros: parametros(producto),
    ...evaluarReorden(producto, total),
    bajo_stock_minimo: producto.stock_minimo !== null && total < producto.stock_minimo,
    por_bodega,
  });
}

/**
 * GET /api/productos/:id/trazabilidad?bodega_id=
 * Historial de movimientos en orden cronológico con el saldo después de cada uno,
 * y para cada entrada la orden de compra, el proveedor y la recepción de donde vino.
 */
async function trazabilidad(req, res) {
  const producto = await buscarMaterial(req.params.id);
  const { bodega_id } = matchedData(req, { locations: ['query'] });

  const movimientos = await Movimiento.findAll({
    where: { producto_id: producto.id },
    include: [
      { model: Bodega, as: 'bodega_origen', attributes: ['id', 'nombre'] },
      { model: Bodega, as: 'bodega_destino', attributes: ['id', 'nombre'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      { model: Recepcion, as: 'recepcion', attributes: ['id', 'fecha', 'observaciones'] },
      {
        model: OrdenCompra,
        as: 'orden',
        attributes: ['id', 'numero', 'fecha', 'estado'],
        include: [
          { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] },
          { model: DetalleOrden, as: 'detalles', attributes: ['producto_id', 'cantidad', 'precio_unitario'] },
        ],
      },
    ],
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  });

  // Efecto de un movimiento sobre una bodega (o sobre el total si no se filtra por bodega)
  const efecto = (m) => {
    if (bodega_id) {
      if (m.bodega_destino_id === bodega_id) return m.cantidad;
      if (m.bodega_origen_id === bodega_id) return -m.cantidad;
      return null; // no toca la bodega pedida
    }
    if (m.tipo === 'traslado') return 0; // un traslado no cambia el total de la empresa
    return m.bodega_destino_id ? m.cantidad : -m.cantidad;
  };

  let saldo = 0;
  const historial = [];
  const porOrden = new Map();

  for (const m of movimientos) {
    const cambio = efecto(m);
    if (cambio === null) continue;
    saldo += cambio;

    let origen_compra = null;
    if (m.orden) {
      const linea = m.orden.detalles.find((d) => d.producto_id === producto.id);
      origen_compra = {
        orden_id: m.orden.id,
        orden: m.orden.numero,
        fecha_orden: m.orden.fecha,
        proveedor: m.orden.proveedor?.razon_social,
        precio_unitario: linea ? Number(linea.precio_unitario) : null,
        recepcion_id: m.recepcion?.id ?? null,
      };

      const resumen = porOrden.get(m.orden.id) || {
        orden_id: m.orden.id,
        orden: m.orden.numero,
        proveedor: m.orden.proveedor?.razon_social,
        estado: m.orden.estado,
        pedida: m.orden.detalles.filter((d) => d.producto_id === producto.id).reduce((s, d) => s + d.cantidad, 0),
        recibida: 0,
      };
      resumen.recibida += m.cantidad;
      porOrden.set(m.orden.id, resumen);
    }

    historial.push({
      id: m.id,
      fecha: m.fecha,
      tipo: m.tipo,
      cantidad: m.cantidad,
      cambio,
      saldo,
      origen: m.bodega_origen?.nombre ?? null,
      destino: m.bodega_destino?.nombre ?? null,
      documento: { tipo: m.documento_tipo, numero: m.documento_numero },
      origen_compra,
      usuario: m.usuario?.nombre ?? null,
      registrado_en: m.created_at,
      observaciones: m.observaciones,
    });
  }

  res.json({
    material: { id: producto.id, codigo: producto.codigo, nombre: producto.nombre, unidad: producto.unidad },
    bodega_id: bodega_id ?? null,
    saldo_final: saldo,
    entradas_por_orden: [...porOrden.values()].map((o) => ({ ...o, pendiente: Math.max(o.pedida - o.recibida, 0) })),
    movimientos: historial,
  });
}

/**
 * GET /api/alertas/reorden?incluir_ok=true
 * Materiales que hoy están en o bajo su punto de reorden, ordenados por prioridad.
 * Se calcula en el momento con el stock que dan los movimientos.
 */
async function reorden(req, res) {
  const { incluir_ok } = matchedData(req, { locations: ['query'] });
  const [productos, totales, abiertas] = await Promise.all([
    Producto.findAll({ attributes: atributosMaterial }),
    stockTotales(),
    AlertaReorden.findAll({ where: { estado: 'abierta' }, attributes: ['id', 'producto_id', 'created_at'] }),
  ]);
  const alertaPor = new Map(abiertas.map((a) => [a.producto_id, a]));

  const filas = productos
    .map((p) => {
      const evaluacion = evaluarReorden(p, totales.get(p.id) || 0);
      const alerta = alertaPor.get(p.id);
      return {
        material_id: p.id,
        codigo: p.codigo,
        material: p.nombre,
        unidad: p.unidad,
        demanda_promedio: p.demanda_promedio,
        tiempo_entrega: p.tiempo_entrega,
        ...evaluacion,
        alerta_id: alerta?.id ?? null,
        alerta_desde: alerta?.created_at ?? null,
      };
    })
    .filter((f) => (incluir_ok ? f.estado !== 'sin_parametros' : ['urgente', 'reponer'].includes(f.estado)))
    .sort(compararPrioridad)
    .map((f, i) => ({ prioridad: i + 1, ...f }));

  res.json(filas);
}

// GET /api/alertas?estado=abierta|cerrada&producto_id= → historial de la tabla de alertas
async function listarAlertas(req, res) {
  const where = matchedData(req, { locations: ['query'] });
  res.json(
    await AlertaReorden.findAll({
      where,
      include: [{ model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] }],
      order: [['estado', 'ASC'], ['created_at', 'DESC']],
    })
  );
}

module.exports = { stock, trazabilidad, reorden, listarAlertas };
