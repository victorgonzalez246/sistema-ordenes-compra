const { body } = require('express-validator');
const { soloCampos, texto } = require('./comunes');

const correo = () =>
  body('correo')
    .exists({ values: 'null' }).withMessage('El correo es obligatorio').bail()
    .isString().withMessage('El correo debe ser texto').bail()
    .trim()
    .notEmpty().withMessage('El correo es obligatorio').bail()
    .isLength({ max: 120 }).withMessage('El correo admite máximo 120 caracteres').bail()
    .isEmail().withMessage('El correo no tiene un formato válido')
    .toLowerCase();

const registro = [
  soloCampos(['nombre', 'correo', 'password']),
  texto('nombre', 'El nombre', 100),
  correo(),
  body('password')
    .exists({ values: 'null' }).withMessage('La contraseña es obligatoria').bail()
    .isString().withMessage('La contraseña debe ser texto').bail()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres').bail()
    // bcrypt solo usa los primeros 72 bytes
    .isLength({ max: 72 }).withMessage('La contraseña admite máximo 72 caracteres'),
];

const login = [
  soloCampos(['correo', 'password']),
  correo(),
  body('password')
    .exists({ values: 'null' }).withMessage('La contraseña es obligatoria').bail()
    .isString().withMessage('La contraseña debe ser texto').bail()
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = { registro, login };
