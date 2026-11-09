const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, texto, referencia } = require('./comunes');
const { ROLES } = require('../services/aprobacion');

const CAMPOS = ['nombre', 'correo', 'password', 'rol', 'departamento_id'];

function reglas({ opcional }) {
  const regla = (campo) => (opcional ? body(campo).optional() : body(campo));
  return [
    texto('nombre', 'El nombre', 100, { opcional }),
    regla('correo')
      .exists({ values: 'null' }).withMessage('El correo es obligatorio').bail()
      .isString().withMessage('El correo debe ser texto').bail()
      .trim()
      .notEmpty().withMessage('El correo es obligatorio').bail()
      .isLength({ max: 120 }).withMessage('El correo admite máximo 120 caracteres').bail()
      .isEmail().withMessage('El correo no tiene un formato válido')
      .toLowerCase(),
    regla('password')
      .exists({ values: 'null' }).withMessage('La contraseña es obligatoria').bail()
      .isString().withMessage('La contraseña debe ser texto').bail()
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres').bail()
      .isLength({ max: 72 }).withMessage('La contraseña admite máximo 72 caracteres'),
    // Rol de la matriz de aprobación y departamento (solo los asigna la Gerencia General)
    body('rol').optional().isIn(Object.keys(ROLES)).withMessage(`El rol debe ser uno de: ${Object.keys(ROLES).join(', ')}`),
    referencia('departamento_id', 'El departamento', { nulo: true }),
  ];
}

module.exports = {
  crearUsuario: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  // Al actualizar, la contraseña es opcional: si no llega, se conserva la actual
  actualizarUsuario: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idUsuario: idParam,
};
