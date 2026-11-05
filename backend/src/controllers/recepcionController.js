const { Recepcion, OrdenCompra, Bodega, Empleado } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias } = require('./reglas');

module.exports = crearControladorCrud(Recepcion, {
  articulo: 'una recepción',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir: [
    { model: OrdenCompra, as: 'orden', attributes: ['id', 'numero', 'estado'] },
    { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
    { model: Empleado, as: 'empleado', attributes: ['id', 'nombre'] },
  ],
  async antesDeGuardar(datos) {
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
  },
});
