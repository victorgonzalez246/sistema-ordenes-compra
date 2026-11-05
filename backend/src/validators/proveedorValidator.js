const { body } = require('express-validator');
const { idParam } = require('./comunes');

const CAMPOS_PERMITIDOS = ['razon_social', 'rif', 'email', 'telefono', 'activo'];

// Reglas por campo; "opcional" se usa en la actualización
function reglas({ opcional }) {
  const campo = (nombre) => (opcional ? body(nombre).optional() : body(nombre));

  return [
    campo('razon_social')
      .exists({ values: 'null' }).withMessage('La razón social es obligatoria').bail()
      .isString().withMessage('La razón social debe ser texto').bail()
      .trim()
      .notEmpty().withMessage('La razón social es obligatoria')
      .isLength({ max: 150 }).withMessage('La razón social admite máximo 150 caracteres'),

    campo('rif')
      .exists({ values: 'null' }).withMessage('El RIF es obligatorio').bail()
      .isString().withMessage('El RIF debe ser texto').bail()
      .trim()
      .notEmpty().withMessage('El RIF es obligatorio')
      .isLength({ max: 20 }).withMessage('El RIF admite máximo 20 caracteres')
      .toUpperCase(),

    campo('email')
      .exists({ values: 'null' }).withMessage('El email es obligatorio').bail()
      .isString().withMessage('El email debe ser texto').bail()
      .trim()
      .notEmpty().withMessage('El email es obligatorio').bail()
      .isEmail().withMessage('El email no tiene un formato válido')
      .isLength({ max: 120 }).withMessage('El email admite máximo 120 caracteres'),

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

// Rechaza campos que no pertenecen al proveedor
const sinCamposExtra = body().custom((valor) => {
  const extra = Object.keys(valor || {}).filter((k) => !CAMPOS_PERMITIDOS.includes(k));
  if (extra.length) throw new Error(`Campos no permitidos: ${extra.join(', ')}`);
  return true;
});

const crearProveedor = [sinCamposExtra, ...reglas({ opcional: false })];

const actualizarProveedor = [
  ...idParam,
  sinCamposExtra,
  body().custom((valor) => {
    if (!valor || Object.keys(valor).length === 0) {
      throw new Error('Envía al menos un campo para actualizar');
    }
    return true;
  }),
  ...reglas({ opcional: true }),
];

module.exports = {
  crearProveedor,
  actualizarProveedor,
  idProveedor: idParam,
};
