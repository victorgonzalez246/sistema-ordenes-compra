const { idParam, soloCampos, alMenosUnCampo, texto, textoOpcional, booleano } = require('./comunes');

const CAMPOS = ['nombre', 'descripcion', 'activo'];

function reglas({ opcional }) {
  return [
    texto('nombre', 'El nombre', 60, { opcional }),
    textoOpcional('descripcion', 'La descripción', 255),
    booleano('activo', 'El campo activo'),
  ];
}

module.exports = {
  crearMetodoPago: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarMetodoPago: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idMetodoPago: idParam,
};
