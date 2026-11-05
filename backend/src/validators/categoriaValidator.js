const { idParam, soloCampos, alMenosUnCampo, texto, textoOpcional } = require('./comunes');

const CAMPOS = ['nombre', 'descripcion'];

function reglas({ opcional }) {
  return [
    texto('nombre', 'El nombre', 80, { opcional }),
    textoOpcional('descripcion', 'La descripción', 255),
  ];
}

module.exports = {
  crearCategoria: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarCategoria: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idCategoria: idParam,
};
