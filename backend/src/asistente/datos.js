const { Op } = require('sequelize');
const {
  OrdenCompra, Requisicion, Cotizacion, Proveedor, Producto, Departamento, Empleado,
  Existencia, Bodega, Recepcion, Factura, Pago, MetodoPago,
} = require('../models');

/**
 * Consultas de SOLO LECTURA que usan los agentes. Ningún agente puede crear,
 * modificar ni borrar datos: solo leen la base y responden.
 * Cada consulta devuelve como máximo LIMITE filas para no gastar tokens de más.
 */
const LIMITE = 50;
const hoy = () => new Date().toISOString().slice(0, 10);
const plano = (filas) => filas.map((f) => f.get({ plain: true }));

// ---------- Compras ----------
async function ordenes({ estado } = {}) {
  return plano(await OrdenCompra.findAll({
    where: estado ? { estado } : {},
    attributes: ['id', 'numero', 'fecha', 'estado', 'total'],
    include: [
      { model: Departamento, as: 'departamento', attributes: ['nombre'] },
      { model: Proveedor, as: 'proveedor', attributes: ['razon_social'] },
    ],
    order: [['fecha', 'DESC']],
    limit: LIMITE,
  }));
}

async function requisiciones({ estado } = {}) {
  return plano(await Requisicion.findAll({
    where: estado ? { estado } : {},
    attributes: ['numero', 'fecha', 'descripcion', 'prioridad', 'monto_estimado', 'estado'],
    include: [{ model: Empleado, as: 'empleado', attributes: ['nombre'] }],
    order: [['fecha', 'DESC']],
    limit: LIMITE,
  }));
}

async function cotizaciones({ producto } = {}) {
  return plano(await Cotizacion.findAll({
    attributes: ['fecha', 'vigencia_hasta', 'precio', 'dias_entrega'],
    include: [
      { model: Proveedor, as: 'proveedor', attributes: ['razon_social', 'activo'] },
      {
        model: Producto,
        as: 'producto',
        attributes: ['codigo', 'nombre', 'unidad'],
        where: producto ? { [Op.or]: [{ nombre: { [Op.like]: `%${producto}%` } }, { codigo: producto }] } : undefined,
      },
    ],
    order: [['precio', 'ASC']],
    limit: LIMITE,
  })).map((c) => ({ ...c, vigente: c.vigencia_hasta >= hoy() }));
}

async function proveedores() {
  return plano(await Proveedor.findAll({
    attributes: ['id', 'razon_social', 'cedula_juridica', 'activo'],
    order: [['razon_social', 'ASC']],
    limit: LIMITE,
  }));
}

// ---------- Inventario ----------
async function existencias({ solo_bajo_minimo: soloBajo } = {}) {
  const filas = plano(await Existencia.findAll({
    attributes: ['cantidad', 'minimo'],
    include: [
      { model: Producto, as: 'producto', attributes: ['codigo', 'nombre', 'unidad'] },
      { model: Bodega, as: 'bodega', attributes: ['nombre'] },
    ],
    limit: 200,
  })).map((e) => ({ ...e, bajo_minimo: e.cantidad < e.minimo, faltante: Math.max(e.minimo - e.cantidad, 0) }));
  return (soloBajo ? filas.filter((e) => e.bajo_minimo) : filas).slice(0, LIMITE);
}

async function bodegas() {
  return plano(await Bodega.findAll({
    attributes: ['nombre', 'ubicacion', 'activa'],
    include: [{ model: Empleado, as: 'responsable', attributes: ['nombre'] }],
    limit: LIMITE,
  }));
}

async function recepciones() {
  return plano(await Recepcion.findAll({
    attributes: ['fecha', 'observaciones'],
    include: [
      { model: OrdenCompra, as: 'orden', attributes: ['numero', 'estado'] },
      { model: Bodega, as: 'bodega', attributes: ['nombre'] },
      { model: Empleado, as: 'empleado', attributes: ['nombre'] },
    ],
    order: [['fecha', 'DESC']],
    limit: LIMITE,
  }));
}

// ---------- Finanzas ----------
async function facturas({ estado } = {}) {
  return plano(await Factura.findAll({
    where: estado ? { estado } : {},
    attributes: ['numero', 'fecha', 'fecha_vencimiento', 'monto', 'pagado', 'estado'],
    include: [{
      model: OrdenCompra,
      as: 'orden',
      attributes: ['numero'],
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['razon_social'] }],
    }],
    order: [['fecha_vencimiento', 'ASC']],
    limit: LIMITE,
  })).map((f) => ({
    ...f,
    saldo: Math.round((Number(f.monto) - Number(f.pagado)) * 100) / 100,
    vencida: f.estado === 'pendiente' && f.fecha_vencimiento < hoy(),
  }));
}

async function pagos() {
  return plano(await Pago.findAll({
    attributes: ['fecha', 'monto', 'referencia'],
    include: [
      { model: Factura, as: 'factura', attributes: ['numero'] },
      { model: MetodoPago, as: 'metodo_pago', attributes: ['nombre'] },
    ],
    order: [['fecha', 'DESC']],
    limit: LIMITE,
  }));
}

async function gastoPorDepartamento() {
  const deps = plano(await Departamento.findAll({ attributes: ['id', 'nombre', 'centro_costo', 'presupuesto'] }));
  const ords = plano(await OrdenCompra.findAll({ attributes: ['departamento_id', 'estado', 'total'] }));
  return deps.map((d) => {
    const propias = ords.filter((o) => o.departamento_id === d.id);
    const suma = (estados) => propias.filter((o) => estados.includes(o.estado)).reduce((s, o) => s + Number(o.total), 0);
    const comprometido = suma(['aprobada', 'recibida']);
    return {
      departamento: d.nombre,
      centro_costo: d.centro_costo,
      presupuesto: Number(d.presupuesto) || 0,
      comprometido,
      en_tramite: suma(['pendiente']),
      porcentaje_usado: d.presupuesto ? Math.round((comprometido / d.presupuesto) * 1000) / 10 : null,
    };
  });
}

module.exports = {
  ordenes, requisiciones, cotizaciones, proveedores,
  existencias, bodegas, recepciones,
  facturas, pagos, gastoPorDepartamento,
};
