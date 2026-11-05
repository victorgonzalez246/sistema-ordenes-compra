const { idParam, soloCampos, alMenosUnCampo, textoOpcional, referencia, fecha, filtroId } = require('./comunes');

const CAMPOS = ['orden_id', 'bodega_id', 'empleado_id', 'fecha', 'observaciones'];

function reglas({ opcional }) {
  return [
    referencia('orden_id', 'La orden', { opcional, femenino: true }),
    referencia('bodega_id', 'La bodega', { opcional, femenino: true }),
    referencia('empleado_id', 'El empleado que recibe', { opcional }),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    textoOpcional('observaciones', 'Las observaciones', 255),
  ];
}

module.exports = {
  crearRecepcion: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarRecepcion: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosRecepcion: [filtroId('orden_id'), filtroId('bodega_id')],
  idRecepcion: idParam,
};
