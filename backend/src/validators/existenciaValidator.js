const { idParam, soloCampos, alMenosUnCampo, referencia, entero, filtroId } = require('./comunes');

const CAMPOS = ['producto_id', 'bodega_id', 'cantidad', 'minimo'];

function reglas({ opcional }) {
  return [
    referencia('producto_id', 'El producto', { opcional }),
    referencia('bodega_id', 'La bodega', { opcional, femenino: true }),
    entero('cantidad', 'La cantidad', { opcional, femenino: true }),
    entero('minimo', 'El mínimo', { opcional: true }),
  ];
}

module.exports = {
  crearExistencia: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarExistencia: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosExistencia: [filtroId('producto_id'), filtroId('bodega_id')],
  idExistencia: idParam,
};
