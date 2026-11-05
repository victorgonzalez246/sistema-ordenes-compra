const { body } = require('express-validator');
const {
  idParam, soloCampos, alMenosUnCampo, textoOpcional, referencia, fecha, entero, filtroId,
} = require('./comunes');

const CAMPOS = ['proveedor_id', 'producto_id', 'fecha', 'vigencia_hasta', 'precio', 'dias_entrega', 'observaciones'];

function reglas({ opcional }) {
  return [
    referencia('proveedor_id', 'El proveedor', { opcional }),
    referencia('producto_id', 'El producto', { opcional }),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    fecha('vigencia_hasta', 'La vigencia', { opcional, femenino: true }),
    (opcional ? body('precio').optional() : body('precio'))
      .exists({ values: 'null' }).withMessage('El precio es obligatorio').bail()
      .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0')
      .toFloat(),
    entero('dias_entrega', 'Los días de entrega', { nulo: true }),
    textoOpcional('observaciones', 'Las observaciones', 255),
  ];
}

module.exports = {
  crearCotizacion: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarCotizacion: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosCotizacion: [filtroId('proveedor_id'), filtroId('producto_id')],
  idCotizacion: idParam,
};
