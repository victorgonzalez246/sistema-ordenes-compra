const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, texto } = require('./comunes');

const CAMPOS = ['razon_social', 'rif', 'email', 'telefono', 'activo'];

function reglas({ opcional }) {
  return [
    texto('razon_social', 'La razón social', 150, { opcional, femenino: true }),
    texto('rif', 'El RIF', 20, { opcional }).toUpperCase(),
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
