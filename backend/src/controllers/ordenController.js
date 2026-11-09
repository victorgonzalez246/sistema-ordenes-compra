const { matchedData } = require('express-validator');
const {
  sequelize,
  OrdenCompra,
  DetalleOrden,
  Departamento,
  Proveedor,
  Producto,
  Factura,
  Recepcion,
  Usuario,
} = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { evaluarOrden } = require('../services/aprobacionDatos');
const { colones } = require('./reglas');
const { datosValidados } = require('../validators/comunes');

// Cambios de estado permitidos: recibida y anulada son estados finales
const TRANSICIONES = {
  pendiente: ['aprobada', 'anulada'],
  aprobada: ['recibida', 'anulada'],
  recibida: [],
  anulada: [],
};

const incluirCabecera = [
  { model: Departamento, as: 'departamento', attributes: ['id', 'nombre', 'centro_costo'] },
  { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'cedula_juridica'] },
  { model: Usuario, as: 'aprobada_por', attributes: ['id', 'nombre', 'rol'] },
];

const incluirCompleto = [
  ...incluirCabecera,
  {
    model: DetalleOrden,
    as: 'detalles',
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] }],
  },
];

const redondear = (n) => Math.round(n * 100) / 100;

async function cargarOrden(id, transaction) {
  const orden = await OrdenCompra.findByPk(id, {
    include: incluirCompleto,
    order: [[{ model: DetalleOrden, as: 'detalles' }, 'id', 'ASC']],
    transaction,
  });
  if (!orden) throw new HttpError(404, `No existe una orden de compra con id ${id}`);
  return orden;
}

// Verifica que el departamento y el proveedor existan y que el proveedor esté activo
async function validarReferencias(datos, actual, transaction) {
  const errores = [];

  if (datos.departamento_id !== undefined) {
    const existe = await Departamento.findByPk(datos.departamento_id, { transaction });
    if (!existe) {
      errores.push({ campo: 'departamento_id', mensaje: `No existe un departamento con id ${datos.departamento_id}` });
    }
  }

  const cambiaProveedor = datos.proveedor_id !== undefined && datos.proveedor_id !== actual?.proveedor_id;
  if (cambiaProveedor) {
    const proveedor = await Proveedor.findByPk(datos.proveedor_id, { transaction });
    if (!proveedor) {
      errores.push({ campo: 'proveedor_id', mensaje: `No existe un proveedor con id ${datos.proveedor_id}` });
    } else if (!proveedor.activo) {
      errores.push({ campo: 'proveedor_id', mensaje: 'El proveedor está inactivo y no puede recibir órdenes nuevas' });
    }
  }

  if (errores.length) throw new HttpError(400, 'La orden hace referencia a registros no válidos', errores);
}

// Arma las líneas con su subtotal; si no llega precio usa el precio de referencia del producto
async function prepararLineas(lineas, transaction) {
  const ids = [...new Set(lineas.map((l) => l.producto_id))];
  const productos = await Producto.findAll({ where: { id: ids }, transaction });
  const porId = new Map(productos.map((p) => [p.id, p]));

  const errores = [];
  const filas = lineas.map((linea, i) => {
    const producto = porId.get(linea.producto_id);
    if (!producto) {
      errores.push({ campo: `detalles[${i}].producto_id`, mensaje: `No existe un producto con id ${linea.producto_id}` });
      return null;
    }
    const precio = linea.precio_unitario ?? Number(producto.precio_ref ?? 0);
    return {
      producto_id: linea.producto_id,
      cantidad: linea.cantidad,
      precio_unitario: precio,
      subtotal: redondear(linea.cantidad * precio),
    };
  });

  if (errores.length) throw new HttpError(400, 'La orden contiene productos no válidos', errores);

  const total = redondear(filas.reduce((suma, f) => suma + f.subtotal, 0));
  return { filas, total };
}

// GET /api/ordenes?estado=&departamento_id=&proveedor_id=
async function listar(req, res) {
  const filtros = matchedData(req, { locations: ['query'] });
  const ordenes = await OrdenCompra.findAll({
    where: filtros,
    include: incluirCabecera,
    order: [['fecha', 'DESC'], ['id', 'DESC']],
  });
  res.json(ordenes);
}

// GET /api/ordenes/:id
async function obtener(req, res) {
  res.json(await cargarOrden(req.params.id));
}

// POST /api/ordenes
async function crear(req, res) {
  const { detalles, ...cabecera } = datosValidados(req);

  const id = await sequelize.transaction(async (transaction) => {
    await validarReferencias(cabecera, null, transaction);
    const { filas, total } = await prepararLineas(detalles, transaction);

    const orden = await OrdenCompra.create({ ...cabecera, estado: 'pendiente', total }, { transaction });
    await DetalleOrden.bulkCreate(
      filas.map((f) => ({ ...f, orden_id: orden.id })),
      { transaction, validate: true }
    );
    return orden.id;
  });

  res.status(201).json(await cargarOrden(id));
}

// PUT /api/ordenes/:id
async function actualizar(req, res) {
  const { detalles, estado, acta_comite: actaComite, ...cabecera } = datosValidados(req);

  await sequelize.transaction(async (transaction) => {
    const orden = await OrdenCompra.findByPk(req.params.id, { transaction });
    if (!orden) throw new HttpError(404, `No existe una orden de compra con id ${req.params.id}`);
    const estadoAnterior = orden.estado;

    const editaContenido = detalles !== undefined || Object.keys(cabecera).length > 0;
    if (editaContenido && orden.estado !== 'pendiente') {
      throw new HttpError(
        409,
        `La orden está ${orden.estado}: solo se pueden modificar los datos de una orden pendiente`
      );
    }

    if (estado !== undefined && estado !== orden.estado) {
      const permitidos = TRANSICIONES[orden.estado];
      if (!permitidos.includes(estado)) {
        throw new HttpError(
          409,
          `No se puede pasar una orden de "${orden.estado}" a "${estado}"`,
          [{ campo: 'estado', mensaje: permitidos.length ? `Estados permitidos: ${permitidos.join(', ')}` : 'Es un estado final' }]
        );
      }
    }

    await validarReferencias(cabecera, orden, transaction);

    const cambios = { ...cabecera };
    if (estado !== undefined) cambios.estado = estado;

    if (detalles !== undefined) {
      const { filas, total } = await prepararLineas(detalles, transaction);
      await DetalleOrden.destroy({ where: { orden_id: orden.id }, transaction });
      await DetalleOrden.bulkCreate(
        filas.map((f) => ({ ...f, orden_id: orden.id })),
        { transaction, validate: true }
      );
      cambios.total = total;
    }

    await orden.update(cambios, { transaction });

    // Aprobar: la matriz de aprobación decide quién puede y con qué requisitos
    if (estado === 'aprobada' && estadoAnterior !== 'aprobada') {
      const { evaluacion } = await evaluarOrden(orden.id, { usuario: req.usuario, actaComite, transaction });
      if (!evaluacion.usuario.puede_aprobar) {
        throw new HttpError(403, evaluacion.usuario.motivo, [
          { campo: 'estado', mensaje: `Monto evaluado ${colones(evaluacion.monto_evaluado)}: aprueba ${evaluacion.requerido.aprueba}` },
        ]);
      }
      if (evaluacion.bloqueos.length) {
        throw new HttpError(409, 'La orden no cumple los requisitos de la matriz de aprobación', evaluacion.bloqueos);
      }
      await orden.update(
        {
          aprobada_por_id: req.usuario.id,
          aprobada_en: new Date(),
          monto_evaluado: evaluacion.monto_evaluado,
          nivel_aprobacion: evaluacion.requerido.rol,
          acta_comite: actaComite ?? null,
        },
        { transaction }
      );
    }
  });

  res.json(await cargarOrden(req.params.id));
}

// GET /api/ordenes/:id/aprobacion: qué pide la matriz para esta orden y si el usuario actual puede aprobarla
async function aprobacion(req, res) {
  const resultado = await evaluarOrden(req.params.id, { usuario: req.usuario, actaComite: req.query.acta_comite });
  if (!resultado) throw new HttpError(404, `No existe una orden de compra con id ${req.params.id}`);
  const { orden, evaluacion, ventana_dias } = resultado;
  res.json({ orden: { id: orden.id, numero: orden.numero, estado: orden.estado }, ventana_dias, ...evaluacion });
}

// DELETE /api/ordenes/:id (sus líneas se borran en cascada)
async function eliminar(req, res) {
  const orden = await OrdenCompra.findByPk(req.params.id);
  if (!orden) throw new HttpError(404, `No existe una orden de compra con id ${req.params.id}`);

  if (!['pendiente', 'anulada'].includes(orden.estado)) {
    throw new HttpError(
      409,
      `No se puede eliminar una orden ${orden.estado}: solo se eliminan órdenes pendientes o anuladas`
    );
  }

  const [facturas, recepciones] = await Promise.all([
    Factura.count({ where: { orden_id: orden.id } }),
    Recepcion.count({ where: { orden_id: orden.id } }),
  ]);
  if (facturas > 0 || recepciones > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar la orden: tiene ${facturas} factura(s) y ${recepciones} recepción(es) registradas`
    );
  }

  await orden.destroy();
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar, aprobacion };
