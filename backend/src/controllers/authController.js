const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_ALGORITMO, BCRYPT_RONDAS } = require('../config/auth');

// Mismo mensaje si el correo no existe o la contraseña falla: no revela qué correos tienen cuenta
const CREDENCIALES_INCORRECTAS = 'Correo o contraseña incorrectos';

// POST /api/auth/register
async function registrar(req, res) {
  const { nombre, correo, password } = datosValidados(req);

  const existe = await Usuario.findOne({ where: { correo } });
  if (existe) {
    throw new HttpError(400, 'Ya existe una cuenta con ese correo', [
      { campo: 'correo', mensaje: 'Ese correo ya está registrado' },
    ]);
  }

  const hash = await bcrypt.hash(password, BCRYPT_RONDAS);
  const usuario = await Usuario.create({ nombre, correo, password: hash });
  res.status(201).json(usuario);
}

// POST /api/auth/login
async function iniciarSesion(req, res) {
  const { correo, password } = datosValidados(req);

  const usuario = await Usuario.scope('conPassword').findOne({ where: { correo } });
  const valida = usuario ? await bcrypt.compare(password, usuario.password) : false;
  if (!valida) throw new HttpError(401, CREDENCIALES_INCORRECTAS);

  // El payload lleva solo el id (sub): nada de contraseñas ni datos sensibles
  const token = jwt.sign({ sub: String(usuario.id) }, JWT_SECRET, {
    algorithm: JWT_ALGORITMO,
    expiresIn: JWT_EXPIRES_IN,
  });
  const { exp } = jwt.decode(token);

  res.json({ token, expira: new Date(exp * 1000).toISOString(), usuario });
}

// GET /api/auth/me (protegida): el middleware ya cargó al usuario del token
function perfil(req, res) {
  res.json(req.usuario);
}

module.exports = { registrar, iniciarSesion, perfil };
