const { idParam, soloCampos, alMenosUnCampo, textoOpcional, referencia, fecha, montoPositivo, filtroId } = require('./comunes');

const CAMPOS = ['factura_id', 'metodo_pago_id', 'fecha', 'monto', 'referencia'];

function reglas({ opcional }) {
  return [
    referencia('factura_id', 'La factura', { opcional, femenino: true }),
    referencia('metodo_pago_id', 'El método de pago', { opcional }),
    fecha('fecha', 'La fecha', { opcional, femenino: true }),
    montoPositivo('monto', 'El monto', { opcional }),
    textoOpcional('referencia', 'La referencia', 60),
  ];
}

module.exports = {
  crearPago: [soloCampos(CAMPOS), ...reglas({ opcional: false })],
  actualizarPago: [...idParam, soloCampos(CAMPOS), alMenosUnCampo, ...reglas({ opcional: true })],
  filtrosPago: [filtroId('factura_id'), filtroId('metodo_pago_id')],
  idPago: idParam,
};
