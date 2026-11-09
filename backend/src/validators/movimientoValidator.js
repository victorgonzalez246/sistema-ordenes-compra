const { body, query } = require('express-validator');
const { idParam, soloCampos, referencia, entero, textoOpcional, opcion, filtroId, filtroOpcion } = require('./comunes');
const { TIPOS, DOCUMENTOS } = require('../models/Movimiento');

const CAMPOS = [
  'tipo', 'fecha', 'producto_id', 'cantidad', 'bodega_origen_id', 'bodega_destino_id',
  'documento_tipo', 'documento_numero', 'orden_id', 'observaciones',
];

const fechaFiltro = (nombre) =>
  query(nombre).optional().isISO8601({ strict: true }).withMessage(`${nombre} debe tener el formato AAAA-MM-DD`);

// La forma según el tipo (qué bodegas y qué documento lleva) se revisa en services/inventario.js
const crearMovimiento = [
  soloCampos(CAMPOS),
  opcion('tipo', 'El tipo', TIPOS, { obligatorio: true }),
  body('fecha')
    .optional({ values: 'null' })
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener el formato AAAA-MM-DD').bail()
    .isISO8601({ strict: true }).withMessage('La fecha no es válida'),
  referencia('producto_id', 'El material'),
  entero('cantidad', 'La cantidad', { min: 1, femenino: true }),
  referencia('bodega_origen_id', 'La bodega de origen', { nulo: true }),
  referencia('bodega_destino_id', 'La bodega de destino', { nulo: true }),
  body('documento_tipo').optional({ values: 'null' })
    .isIn(DOCUMENTOS).withMessage(`El documento debe ser uno de: ${DOCUMENTOS.join(', ')}`),
  textoOpcional('documento_numero', 'El número de documento', 40),
  referencia('orden_id', 'La orden de compra', { nulo: true }),
  textoOpcional('observaciones', 'Las observaciones', 255),
];

const filtrosMovimiento = [
  filtroId('producto_id'),
  filtroId('bodega_id'),
  filtroId('orden_id'),
  filtroOpcion('tipo', TIPOS),
  fechaFiltro('desde'),
  fechaFiltro('hasta'),
];

module.exports = { crearMovimiento, filtrosMovimiento, idMovimiento: idParam };
