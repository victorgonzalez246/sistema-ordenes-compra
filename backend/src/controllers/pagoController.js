const { Pago, Factura, MetodoPago } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { recalcularFactura } = require('./facturaController');
const { verificarReferencias, valorFinal, colones, redondear } = require('./reglas');

module.exports = crearControladorCrud(Pago, {
  articulo: 'un pago',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir: [
    { model: Factura, as: 'factura', attributes: ['id', 'numero', 'monto', 'pagado', 'estado'] },
    { model: MetodoPago, as: 'metodo_pago', attributes: ['id', 'nombre'] },
  ],
  async antesDeGuardar(datos, actual) {
    const cambiaMetodo = datos.metodo_pago_id !== undefined && datos.metodo_pago_id !== actual?.metodo_pago_id;
    await verificarReferencias(datos, [
      { campo: 'factura_id', Modelo: Factura, nombre: 'una factura' },
      {
        campo: 'metodo_pago_id',
        Modelo: MetodoPago,
        nombre: 'un método de pago',
        activo: cambiaMetodo ? 'El método de pago está inactivo' : undefined,
      },
    ]);

    const factura = await Factura.findByPk(valorFinal('factura_id', datos, actual));
    if (factura.estado === 'anulada') {
      throw new HttpError(400, 'No se pueden registrar pagos de una factura anulada', [
        { campo: 'factura_id', mensaje: 'La factura está anulada' },
      ]);
    }

    // El pago no puede superar el saldo (si se edita, su monto anterior vuelve al saldo)
    const devuelve = actual && actual.factura_id === factura.id ? Number(actual.monto) : 0;
    const saldo = redondear(Number(factura.monto) - Number(factura.pagado) + devuelve);
    const monto = Number(valorFinal('monto', datos, actual));
    if (monto > saldo) {
      throw new HttpError(409, `El pago supera el saldo pendiente de la factura ${factura.numero} (${colones(saldo)})`, [
        { campo: 'monto', mensaje: `Máximo ${colones(saldo)}` },
      ]);
    }
  },
  // Mantiene al día lo pagado y el estado de la factura (y de la anterior si cambió)
  async despuesDeGuardar(pago, previo) {
    await recalcularFactura(pago.factura_id);
    if (previo && previo.factura_id !== pago.factura_id) await recalcularFactura(previo.factura_id);
  },
  async despuesDeEliminar(pago) {
    await recalcularFactura(pago.factura_id);
  },
});
