const { body, param, matchedData } = require('express-validator');

// Campos del cuerpo que pasaron la validación. Se descarta la clave vacía que
// agregan las reglas aplicadas al cuerpo completo (soloCampos, alMenosUnCampo).
function datosValidados(req) {
  // eslint-disable-next-line no-unused-vars
  const { '': _cuerpoCompleto, ...datos } = matchedData(req, { locations: ['body'] });
  return datos;
}

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt(),
];

// Rechaza campos que no pertenecen a la entidad
function soloCampos(permitidos) {
  return body().custom((valor) => {
    const extra = Object.keys(valor || {}).filter((k) => !permitidos.includes(k));
    if (extra.length) throw new Error(`Campos no permitidos: ${extra.join(', ')}`);
    return true;
  });
}

// En una actualización exige que llegue al menos un campo
const alMenosUnCampo = body().custom((valor) => {
  if (!valor || Object.keys(valor).length === 0) {
    throw new Error('Envía al menos un campo para actualizar');
  }
  return true;
});

// Texto obligatorio (o validado solo si viene, cuando opcional = true)
function texto(nombre, etiqueta, max, { opcional = false, femenino = false } = {}) {
  const regla = opcional ? body(nombre).optional() : body(nombre);
  const obligatorio = `${etiqueta} es ${femenino ? 'obligatoria' : 'obligatorio'}`;
  return regla
    .exists({ values: 'null' }).withMessage(obligatorio).bail()
    .isString().withMessage(`${etiqueta} debe ser texto`).bail()
    .trim()
    .notEmpty().withMessage(obligatorio).bail()
    .isLength({ max }).withMessage(`${etiqueta} admite máximo ${max} caracteres`);
}

// Monto decimal opcional, mayor o igual a 0 (admite null)
function montoOpcional(nombre, etiqueta) {
  return body(nombre)
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage(`${etiqueta} debe ser un número mayor o igual a 0`)
    .toFloat();
}

module.exports = { idParam, soloCampos, alMenosUnCampo, texto, montoOpcional, datosValidados };
