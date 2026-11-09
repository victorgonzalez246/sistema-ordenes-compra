const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, textoOpcional, referencia, fecha, filtroId } = require('./comunes');

const CAMPOS = ['orden_id', 'bodega_id', 'empleado_id', 'fecha', 'observaciones'];

function reglas({ opcional }) {
  return [
    referencia('orden_id', 'La orden', { opcional, femenino: true }),
    referencia('bodega_id', 'La bodega', { opcional, femenino: true }),
    referencia('empleado_id', 'El empleado que recibe', { opcional }),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    textoOpcional('observaciones', 'Las observaciones', 255),
  ];
}

// Lo que llegó físicamente: cada línea genera una entrada de inventario ligada a la orden
const lineas = [
  body('lineas').optional().isArray({ min: 1 }).withMessage('lineas debe ser una lista con al menos un material'),
  body('lineas.*.producto_id')
    .exists({ values: 'null' }).withMessage('El material es obligatorio').bail()
    .isInt({ min: 1 }).withMessage('El material debe ser un id numérico').toInt(),
  body('lineas.*.cantidad')
    .exists({ values: 'null' }).withMessage('La cantidad es obligatoria').bail()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor que 0').toInt(),
];

module.exports = {
  crearRecepcion: [soloCampos([...CAMPOS, 'lineas']), ...reglas({ opcional: false }), ...lineas],
  actualizarRecepcion: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosRecepcion: [filtroId('orden_id'), filtroId('bodega_id')],
  idRecepcion: idParam,
};
