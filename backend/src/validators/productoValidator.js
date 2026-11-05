const { idParam, soloCampos, alMenosUnCampo, texto, montoOpcional } = require('./comunes');

const CAMPOS = ['codigo', 'nombre', 'unidad', 'precio_ref'];

function reglas({ opcional }) {
  return [
    texto('codigo', 'El código', 30, { opcional }).toUpperCase(),
    texto('nombre', 'El nombre', 150, { opcional }),
    texto('unidad', 'La unidad', 20, { opcional, femenino: true }),
    montoOpcional('precio_ref', 'El precio de referencia'),
  ];
}

module.exports = {
  crearProducto: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarProducto: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idProducto: idParam,
};
