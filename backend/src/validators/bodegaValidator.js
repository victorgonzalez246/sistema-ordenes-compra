const { idParam, soloCampos, alMenosUnCampo, texto, referencia, booleano } = require('./comunes');

const CAMPOS = ['nombre', 'ubicacion', 'activa', 'responsable_id'];

function reglas({ opcional }) {
  return [
    texto('nombre', 'El nombre', 80, { opcional }),
    texto('ubicacion', 'La ubicación', 200, { opcional, femenino: true }),
    booleano('activa', 'El campo activa'),
    referencia('responsable_id', 'El responsable', { nulo: true }),
  ];
}

module.exports = {
  crearBodega: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarBodega: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idBodega: idParam,
};
