const { body } = require('express-validator');
const { soloCampos } = require('./comunes');

const preguntar = [
  soloCampos(['pregunta', 'historial']),
  body('pregunta')
    .exists({ values: 'null' }).withMessage('La pregunta es obligatoria').bail()
    .isString().withMessage('La pregunta debe ser texto').bail()
    .trim()
    .notEmpty().withMessage('La pregunta es obligatoria').bail()
    .isLength({ max: 1000 }).withMessage('La pregunta admite máximo 1000 caracteres'),
  // Conversación previa (solo texto), para que el asistente recuerde el contexto
  body('historial')
    .optional()
    .isArray({ max: 20 }).withMessage('El historial admite máximo 20 mensajes'),
  body('historial.*.rol')
    .isIn(['usuario', 'asistente']).withMessage('El rol debe ser usuario o asistente'),
  body('historial.*.texto')
    .isString().withMessage('El texto del historial debe ser texto').bail()
    .isLength({ min: 1, max: 4000 }).withMessage('Cada mensaje del historial admite máximo 4000 caracteres'),
];

module.exports = { preguntar };
