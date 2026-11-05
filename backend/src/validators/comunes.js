const { param } = require('express-validator');

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt(),
];

module.exports = { idParam };
