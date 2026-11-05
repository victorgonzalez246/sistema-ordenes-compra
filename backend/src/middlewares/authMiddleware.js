const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { JWT_SECRET, JWT_ALGORITMO } = require('../config/auth');

function noAutorizado(res) {
  return res.status(401).json({ error: 'No autorizado', detalles: [] });
}

/**
 * Protege las rutas: exige el encabezado "Authorization: Bearer <token>".
 * Si falta, está mal formado, la firma no coincide, venció o el usuario ya no existe, responde 401.
 */
async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');
  if (esquema !== 'Bearer' || !token) return noAutorizado(res);

  let datos;
  try {
    datos = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITMO] });
  } catch {
    return noAutorizado(res);
  }

  const usuario = await Usuario.findByPk(datos.sub);
  if (!usuario) return noAutorizado(res);

  req.usuario = usuario;
  return next();
}

module.exports = autenticar;
