const {
  UniqueConstraintError,
  ValidationError,
  ForeignKeyConstraintError,
} = require('sequelize');

// Error con código HTTP propio, lanzado desde los controladores
class HttpError extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

function mapearDetalles(errores = []) {
  return errores.map((e) => ({ campo: e.path, mensaje: e.message }));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, detalles: err.detalles });
  }

  // Valor repetido en un campo único (cédula jurídica, código, número de orden)
  if (err instanceof UniqueConstraintError) {
    const detalles = mapearDetalles(err.errors);
    return res.status(409).json({
      error: detalles[0]?.mensaje || 'El registro ya existe',
      detalles,
    });
  }

  // Registro referenciado por otra tabla (ON DELETE RESTRICT) o FK inexistente
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      error: 'La operación viola una relación con otros registros',
      detalles: [],
    });
  }

  // Validaciones definidas en los modelos de Sequelize
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Datos de entrada no válidos',
      detalles: mapearDetalles(err.errors),
    });
  }

  // JSON mal formado en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido', detalles: [] });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor', detalles: [] });
}

module.exports = errorHandler;
module.exports.HttpError = HttpError;
