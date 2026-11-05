const { body, param, query, matchedData } = require('express-validator');

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

// Regla base: obligatoria, o validada solo si viene cuando opcional = true
function base(nombre, etiqueta, { opcional = false, femenino = false } = {}) {
  const regla = opcional ? body(nombre).optional() : body(nombre);
  return regla.exists({ values: 'null' }).withMessage(`${etiqueta} es ${femenino ? 'obligatoria' : 'obligatorio'}`).bail();
}

// Texto que admite null o vacío (se guarda como null)
function textoOpcional(nombre, etiqueta, max) {
  return body(nombre)
    .optional({ values: 'null' })
    .isString().withMessage(`${etiqueta} debe ser texto`).bail()
    .trim()
    .isLength({ max }).withMessage(`${etiqueta} admite máximo ${max} caracteres`)
    .customSanitizer((v) => (v === '' ? null : v));
}

function email(nombre, etiqueta, max, opciones) {
  return texto(nombre, etiqueta, max, opciones).bail()
    .isEmail().withMessage(`${etiqueta} no tiene un formato válido`);
}

// Id de otra tabla (la existencia del registro se verifica en el controlador)
function referencia(nombre, etiqueta, opciones = {}) {
  if (opciones.nulo) {
    return body(nombre)
      .optional({ values: 'null' })
      .isInt({ min: 1 }).withMessage(`${etiqueta} debe ser un id numérico`)
      .toInt();
  }
  return base(nombre, etiqueta, opciones)
    .isInt({ min: 1 }).withMessage(`${etiqueta} debe ser un id numérico`)
    .toInt();
}

// Fecha en formato AAAA-MM-DD
function fecha(nombre, etiqueta, opciones = {}) {
  return base(nombre, etiqueta, opciones)
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(`${etiqueta} debe tener el formato AAAA-MM-DD`).bail()
    .isISO8601({ strict: true }).withMessage(`${etiqueta} no es válida`);
}

// Entero con mínimo (por defecto 0); con nulo = true admite null
function entero(nombre, etiqueta, { min = 0, nulo = false, ...opciones } = {}) {
  const regla = nulo ? body(nombre).optional({ values: 'null' }) : base(nombre, etiqueta, opciones);
  return regla
    .isInt({ min }).withMessage(`${etiqueta} debe ser un número entero mayor o igual a ${min}`)
    .toInt();
}

// Monto obligatorio mayor que 0
function montoPositivo(nombre, etiqueta, opciones = {}) {
  return base(nombre, etiqueta, opciones)
    .isFloat({ gt: 0 }).withMessage(`${etiqueta} debe ser un número mayor que 0`)
    .toFloat();
}

function booleano(nombre, etiqueta) {
  return body(nombre)
    .optional()
    .isBoolean({ strict: true }).withMessage(`${etiqueta} debe ser true o false`);
}

// Valor dentro de una lista cerrada
function opcion(nombre, etiqueta, valores, opciones = {}) {
  const regla = opciones.obligatorio ? base(nombre, etiqueta, opciones) : body(nombre).optional();
  return regla.isIn(valores).withMessage(`${etiqueta} debe ser uno de: ${valores.join(', ')}`);
}

// Filtros del listado (?proveedor_id=1, ?estado=pendiente)
function filtroId(nombre) {
  return query(nombre).optional().isInt({ min: 1 }).withMessage(`${nombre} debe ser un id numérico`).toInt();
}

function filtroOpcion(nombre, valores) {
  return query(nombre).optional().isIn(valores).withMessage(`${nombre} debe ser uno de: ${valores.join(', ')}`);
}

module.exports = {
  idParam,
  soloCampos,
  alMenosUnCampo,
  texto,
  textoOpcional,
  email,
  referencia,
  fecha,
  entero,
  montoOpcional,
  montoPositivo,
  booleano,
  opcion,
  filtroId,
  filtroOpcion,
  datosValidados,
};
