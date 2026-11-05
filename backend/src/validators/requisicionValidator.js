const { body } = require('express-validator');
const {
  idParam, soloCampos, alMenosUnCampo, texto, referencia, fecha, montoOpcional, opcion, filtroId, filtroOpcion,
} = require('./comunes');
const { ESTADOS, PRIORIDADES } = require('../models/Requisicion');

const CAMPOS = ['numero', 'fecha', 'descripcion', 'prioridad', 'monto_estimado', 'estado', 'empleado_id'];

function reglas({ opcional }) {
  return [
    texto('numero', 'El número', 30, { opcional }).toUpperCase(),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    texto('descripcion', 'La descripción', 255, { opcional, femenino: true }),
    opcion('prioridad', 'La prioridad', PRIORIDADES),
    montoOpcional('monto_estimado', 'El monto estimado'),
    referencia('empleado_id', 'El empleado', { opcional }),
  ];
}

module.exports = {
  crearRequisicion: [
    soloCampos(CAMPOS),
    ...reglas({ opcional: false }),
    body('estado').optional().equals('pendiente').withMessage('Una requisición nueva se crea en estado pendiente'),
  ],
  actualizarRequisicion: [
    ...idParam,
    soloCampos(CAMPOS),
    alMenosUnCampo,
    ...reglas({ opcional: true }),
    opcion('estado', 'El estado', ESTADOS),
  ],
  filtrosRequisicion: [filtroOpcion('estado', ESTADOS), filtroId('empleado_id')],
  idRequisicion: idParam,
};
