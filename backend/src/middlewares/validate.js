const { validationResult } = require('express-validator');

// Corta la petición con 400 si alguna regla de express-validator falló
function validate(req, res, next) {
  const errores = validationResult(req);
  if (errores.isEmpty()) return next();

  return res.status(400).json({
    error: 'Datos de entrada no válidos',
    detalles: errores.array().map((e) => ({
      campo: e.path,
      ubicacion: e.location,
      mensaje: e.msg,
    })),
  });
}

module.exports = validate;
