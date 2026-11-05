const { body, query } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, texto } = require('./comunes');
const { ESTADOS } = require('../models/OrdenCompra');

const CAMPOS = ['numero', 'fecha', 'estado', 'departamento_id', 'proveedor_id', 'detalles'];

function idReferencia(nombre, etiqueta, { opcional }) {
  const regla = opcional ? body(nombre).optional() : body(nombre);
  return regla
    .exists({ values: 'null' }).withMessage(`${etiqueta} es obligatorio`).bail()
    .isInt({ min: 1 }).withMessage(`${etiqueta} debe ser un id numérico`)
    .toInt();
}

function reglas({ opcional }) {
  const detalles = opcional ? body('detalles').optional() : body('detalles');
  return [
    texto('numero', 'El número de orden', 30, { opcional }).toUpperCase(),
    (opcional ? body('fecha').optional() : body('fecha'))
      .exists({ values: 'null' }).withMessage('La fecha es obligatoria').bail()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener el formato AAAA-MM-DD').bail()
      .isISO8601({ strict: true }).withMessage('La fecha no es válida'),
    idReferencia('departamento_id', 'El departamento', { opcional }),
    idReferencia('proveedor_id', 'El proveedor', { opcional }),
    detalles
      .isArray({ min: 1 }).withMessage('La orden debe tener al menos una línea de detalle'),
    body('detalles.*.producto_id')
      .exists({ values: 'null' }).withMessage('El producto es obligatorio').bail()
      .isInt({ min: 1 }).withMessage('El producto debe ser un id numérico')
      .toInt(),
    body('detalles.*.cantidad')
      .exists({ values: 'null' }).withMessage('La cantidad es obligatoria').bail()
      .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor que 0')
      .toInt(),
    body('detalles.*.precio_unitario')
      .optional({ values: 'null' })
      .isFloat({ min: 0 }).withMessage('El precio unitario debe ser un número mayor o igual a 0')
      .toFloat(),
  ];
}

const crearOrden = [
  soloCampos(CAMPOS),
  ...reglas({ opcional: false }),
  body('estado')
    .optional()
    .equals('pendiente').withMessage('Una orden nueva se crea en estado pendiente'),
];

const actualizarOrden = [
  ...idParam,
  soloCampos(CAMPOS),
  alMenosUnCampo,
  ...reglas({ opcional: true }),
  body('estado')
    .optional()
    .isIn(ESTADOS).withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}`),
];

const filtrosOrden = [
  query('estado').optional().isIn(ESTADOS).withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}`),
  query('departamento_id').optional().isInt({ min: 1 }).withMessage('departamento_id debe ser numérico').toInt(),
  query('proveedor_id').optional().isInt({ min: 1 }).withMessage('proveedor_id debe ser numérico').toInt(),
];

module.exports = { crearOrden, actualizarOrden, filtrosOrden, idOrden: idParam };
