const { idParam, soloCampos, alMenosUnCampo, texto, montoOpcional } = require('./comunes');

const CAMPOS = ['nombre', 'centro_costo', 'presupuesto'];

function reglas({ opcional }) {
  return [
    texto('nombre', 'El nombre', 100, { opcional }),
    texto('centro_costo', 'El centro de costo', 20, { opcional }).toUpperCase(),
    montoOpcional('presupuesto', 'El presupuesto'),
  ];
}

module.exports = {
  crearDepartamento: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarDepartamento: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  idDepartamento: idParam,
};
