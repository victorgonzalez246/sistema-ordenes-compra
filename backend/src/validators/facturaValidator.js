const { body } = require('express-validator');
const {
  idParam, soloCampos, alMenosUnCampo, texto, referencia, fecha, montoPositivo, filtroId, filtroOpcion,
} = require('./comunes');
const { ESTADOS } = require('../models/Factura');

const CAMPOS = ['numero', 'orden_id', 'fecha', 'fecha_vencimiento', 'monto', 'estado'];

function reglas({ opcional }) {
  return [
    texto('numero', 'El número', 30, { opcional }).toUpperCase(),
    referencia('orden_id', 'La orden', { opcional, femenino: true }),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    fecha('fecha_vencimiento', 'La fecha de vencimiento', { opcional, femenino: true }),
    montoPositivo('monto', 'El monto', { opcional }),
  ];
}

module.exports = {
  crearFactura: [
    soloCampos(CAMPOS),
    ...reglas({ opcional: false }),
    body('estado').optional().equals('pendiente').withMessage('Una factura nueva se crea en estado pendiente'),
  ],
  actualizarFactura: [
    ...idParam,
    soloCampos(CAMPOS),
    alMenosUnCampo,
    ...reglas({ opcional: true }),
    // "pagada" no se envía: el servidor la asigna cuando los pagos cubren el monto
    body('estado')
      .optional()
      .isIn(['pendiente', 'anulada'])
      .withMessage('El estado solo puede cambiarse a pendiente o anulada; "pagada" se asigna automáticamente'),
  ],
  filtrosFactura: [filtroOpcion('estado', ESTADOS), filtroId('orden_id')],
  idFactura: idParam,
};
