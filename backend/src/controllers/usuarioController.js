const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');
const { BCRYPT_RONDAS } = require('../config/auth');

// La contraseña nunca sale en las respuestas: el modelo la excluye por defecto

async function buscarOFallar(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new HttpError(404, `No existe un usuario con id ${id}`);
  return usuario;
}

// Mismo criterio que el registro: correo repetido -> 400
async function verificarCorreoLibre(correo, idActual) {
  const otro = await Usuario.findOne({
    where: { correo, ...(idActual ? { id: { [Op.ne]: idActual } } : {}) },
  });
  if (otro) {
    throw new HttpError(400, 'Ya existe una cuenta con ese correo', [
      { campo: 'correo', mensaje: 'Ese correo ya está registrado' },
    ]);
  }
}

// GET /api/usuarios
async function listar(req, res) {
  res.json(await Usuario.findAll({ order: [['nombre', 'ASC']] }));
}

// GET /api/usuarios/:id
async function obtener(req, res) {
  res.json(await buscarOFallar(req.params.id));
}

// POST /api/usuarios
async function crear(req, res) {
  const datos = datosValidados(req);
  await verificarCorreoLibre(datos.correo);
  const usuario = await Usuario.create({ ...datos, password: await bcrypt.hash(datos.password, BCRYPT_RONDAS) });
  res.status(201).json(await buscarOFallar(usuario.id));
}

// PUT /api/usuarios/:id (si llega una contraseña nueva, se vuelve a cifrar)
async function actualizar(req, res) {
  const usuario = await buscarOFallar(req.params.id);
  const datos = datosValidados(req);
  if (datos.correo !== undefined) await verificarCorreoLibre(datos.correo, usuario.id);
  if (datos.password !== undefined) datos.password = await bcrypt.hash(datos.password, BCRYPT_RONDAS);
  await usuario.update(datos);
  res.json(await buscarOFallar(usuario.id));
}

// DELETE /api/usuarios/:id (no se puede eliminar la cuenta con la que se inició sesión)
async function eliminar(req, res) {
  const usuario = await buscarOFallar(req.params.id);
  if (usuario.id === req.usuario.id) {
    throw new HttpError(409, 'No puedes eliminar la cuenta con la que iniciaste sesión');
  }
  await usuario.destroy();
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
