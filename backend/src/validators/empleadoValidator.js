const {
  idParam, soloCampos, alMenosUnCampo, texto, textoOpcional, email, referencia, booleano, filtroId,
} = require('./comunes');

const CAMPOS = ['cedula', 'nombre', 'puesto', 'email', 'telefono', 'activo', 'departamento_id'];

// Cédula física de Costa Rica: 1-2345-6789
const FORMATO_CEDULA = /^\d-\d{4}-\d{4}$/;

function reglas({ opcional }) {
  return [
    texto('cedula', 'La cédula', 12, { opcional, femenino: true }).bail()
      .matches(FORMATO_CEDULA).withMessage('La cédula debe tener el formato 1-2345-6789'),
    texto('nombre', 'El nombre', 120, { opcional }),
    texto('puesto', 'El puesto', 80, { opcional }),
    email('email', 'El email', 120, { opcional }),
    textoOpcional('telefono', 'El teléfono', 30),
    booleano('activo', 'El campo activo'),
    referencia('departamento_id', 'El departamento', { opcional }),
  ];
}

module.exports = {
  crearEmpleado: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarEmpleado: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosEmpleado: [filtroId('departamento_id')],
  idEmpleado: idParam,
};
