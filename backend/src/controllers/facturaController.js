const { Op } = require('sequelize');
const { Factura, Pago, OrdenCompra, Proveedor } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, valorFinal, colones, redondear } = require('./reglas');

// Recalcula lo pagado y el estado de una factura a partir de sus pagos
async function recalcularFactura(id) {
  const factura = await Factura.findByPk(id);
  if (!factura) return;
  const pagado = redondear((await Pago.sum('monto', { where: { factura_id: id } })) || 0);
  const cambios = { pagado };
  if (factura.estado !== 'anulada') {
    cambios.estado = pagado >= Number(factura.monto) ? 'pagada' : 'pendiente';
  }
  await factura.update(cambios);
}

const controlador = crearControladorCrud(Factura, {
  articulo: 'una factura',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir: [
    {
      model: OrdenCompra,
      as: 'orden',
      attributes: ['id', 'numero', 'total', 'estado'],
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }],
    },
  ],
  async antesDeGuardar(datos, actual) {
    if (actual?.estado === 'anulada') {
      throw new HttpError(409, 'La factura está anulada: es un estado final');
    }

    const { orden_id: ordenNueva } = await verificarReferencias(datos, [
      { campo: 'orden_id', Modelo: OrdenCompra, nombre: 'una orden de compra' },
    ]);
    if (ordenNueva && !['aprobada', 'recibida'].includes(ordenNueva.estado)) {
      throw new HttpError(400, `No se puede facturar una orden ${ordenNueva.estado}`, [
        { campo: 'orden_id', mensaje: 'La orden debe estar aprobada o recibida' },
      ]);
    }

    const fecha = valorFinal('fecha', datos, actual);
    const vencimiento = valorFinal('fecha_vencimiento', datos, actual);
    if (vencimiento < fecha) {
      throw new HttpError(400, 'La fecha de vencimiento no puede ser anterior a la fecha de la factura', [
        { campo: 'fecha_vencimiento', mensaje: 'Debe ser igual o posterior a la fecha' },
      ]);
    }

    const pagado = Number(actual?.pagado ?? 0);
    const monto = Number(valorFinal('monto', datos, actual));
    if (monto < pagado) {
      throw new HttpError(409, `El monto no puede ser menor que lo ya pagado (${colones(pagado)})`);
    }
    if (datos.estado === 'anulada' && pagado > 0) {
      throw new HttpError(409, 'No se puede anular una factura que tiene pagos registrados');
    }

    // Lo facturado de una orden no puede superar su total
    const orden = ordenNueva || (await OrdenCompra.findByPk(actual.orden_id));
    const otras = await Factura.sum('monto', {
      where: {
        orden_id: orden.id,
        estado: { [Op.ne]: 'anulada' },
        ...(actual ? { id: { [Op.ne]: actual.id } } : {}),
      },
    });
    const disponible = redondear(Number(orden.total) - (otras || 0));
    if (datos.estado !== 'anulada' && monto > disponible) {
      throw new HttpError(
        409,
        `El monto supera lo pendiente de facturar de la orden ${orden.numero} (${colones(disponible)})`
      );
    }
  },
  async despuesDeGuardar(factura) {
    await recalcularFactura(factura.id);
  },
  async antesDeEliminar(factura) {
    const pagos = await Pago.count({ where: { factura_id: factura.id } });
    if (pagos > 0) {
      throw new HttpError(409, `No se puede eliminar la factura: tiene ${pagos} pago(s) registrado(s)`);
    }
  },
});

module.exports = { ...controlador, recalcularFactura };
