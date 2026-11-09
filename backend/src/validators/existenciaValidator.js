const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, referencia, entero, filtroId } = require('./comunes');

// La cantidad no se digita: sale de los movimientos (POST /api/movimientos)
const sinCantidad = body('cantidad')
  .not().exists()
  .withMessage('La cantidad se calcula con los movimientos; registre una entrada, salida o ajuste');

module.exports = {
  crearExistencia: [
    soloCampos(['producto_id', 'bodega_id', 'minimo', 'cantidad']),
    sinCantidad,
    referencia('producto_id', 'El producto'),
    referencia('bodega_id', 'La bodega', { femenino: true }),
    entero('minimo', 'El mínimo', { opcional: true }),
  ],
  // Solo el mínimo de la bodega se puede cambiar
  actualizarExistencia: [
    ...idParam,
    soloCampos(['minimo', 'cantidad']),
    sinCantidad,
    alMenosUnCampo,
    entero('minimo', 'El mínimo', { opcional: true }),
  ],
  filtrosExistencia: [filtroId('producto_id'), filtroId('bodega_id')],
  idExistencia: idParam,
};
