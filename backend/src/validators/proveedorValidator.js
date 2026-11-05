const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, texto } = require('./comunes');

const CAMPOS = ['razon_social', 'cedula_juridica', 'email', 'telefono', 'activo'];

// Cédula jurídica de Costa Rica: 3-101-123456
const FORMATO_CEDULA = /^\d-\d{3}-\d{6}$/;

function reglas({ opcional }) {
  return [
    texto('razon_social', 'La razón social', 150, { opcional, femenino: true }),
    texto('cedula_juridica', 'La cédula jurídica', 12, { opcional, femenino: true }).bail()
      .matches(FORMATO_CEDULA).withMessage('La cédula jurídica debe tener el formato 3-101-123456'),
    texto('email', 'El email', 120, { opcional }).bail()
      .isEmail().withMessage('El email no tiene un formato válido'),
    body('telefono')
      .optional({ values: 'null' })
      .isString().withMessage('El teléfono debe ser texto').bail()
      .trim()
      .isLength({ max: 30 }).withMessage('El teléfono admite máximo 30 caracteres'),
    body('activo')
      .optional()
      .isBoolean({ strict: true }).withMessage('El campo activo debe ser true o false'),
  ];
}

module.exports = {
  crearProveedor: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarProveedor: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idProveedor: idParam,
};
