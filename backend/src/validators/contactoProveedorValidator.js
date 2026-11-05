const {
  idParam, soloCampos, alMenosUnCampo, texto, textoOpcional, email, referencia, booleano, filtroId,
} = require('./comunes');

const CAMPOS = ['proveedor_id', 'nombre', 'puesto', 'email', 'telefono', 'principal'];

function reglas({ opcional }) {
  return [
    referencia('proveedor_id', 'El proveedor', { opcional }),
    texto('nombre', 'El nombre', 120, { opcional }),
    textoOpcional('puesto', 'El puesto', 80),
    email('email', 'El email', 120, { opcional }),
    textoOpcional('telefono', 'El teléfono', 30),
    booleano('principal', 'El campo principal'),
  ];
}

module.exports = {
  crearContacto: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarContacto: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosContacto: [filtroId('proveedor_id')],
  idContacto: idParam,
};
