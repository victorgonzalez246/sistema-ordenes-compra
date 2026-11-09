const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Departamento } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');
const { BCRYPT_RONDAS } = require('../config/auth');

// La contraseña nunca sale en las respuestas: el modelo la excluye por defecto

const incluir = [{ model: Departamento, as: 'departamento', attributes: ['id', 'nombre'] }];

async function buscarOFallar(id) {
  const usuario = await Usuario.findByPk(id, { include: incluir });
  if (!usuario) throw new HttpError(404, `No existe un usuario con id ${id}`);
  return usuario;
}

/**
 * El rol y el departamento deciden qué órdenes puede aprobar cada quien (matriz de aprobación):
 * solo la Gerencia General los asigna, para que nadie se suba de nivel a sí mismo.
 */
async function verificarAsignacion(datos, solicitante, destino = null) {
  if (datos.rol === undefined && datos.departamento_id === undefined) return;
  if (solicitante.rol !== 'gerencia_general') {
    throw new HttpError(403, 'Solo la Gerencia General puede asignar roles y departamentos', [
      { campo: datos.rol !== undefined ? 'rol' : 'departamento_id', mensaje: 'Permiso insuficiente' },
    ]);
  }
  // Evita que la Gerencia General se quite el rol a sí misma y deje el sistema sin quien apruebe lo grande
  if (destino && destino.id === solicitante.id && datos.rol !== undefined && datos.rol !== destino.rol) {
    throw new HttpError(409, 'No puedes cambiar tu propio rol', [
      { campo: 'rol', mensaje: 'Pide a otra persona de Gerencia General que lo haga' },
    ]);
  }
  if (datos.departamento_id) {
    const existe = await Departamento.findByPk(datos.departamento_id);
    if (!existe) {
      throw new HttpError(400, 'Datos no válidos', [
        { campo: 'departamento_id', mensaje: `No existe un departamento con id ${datos.departamento_id}` },
      ]);
    }
  }
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
  res.json(await Usuario.findAll({ include: incluir, order: [['nombre', 'ASC']] }));
}

// GET /api/usuarios/:id
async function obtener(req, res) {
  res.json(await buscarOFallar(req.params.id));
}

// POST /api/usuarios
async function crear(req, res) {
  const datos = datosValidados(req);
  await verificarCorreoLibre(datos.correo);
  await verificarAsignacion(datos, req.usuario);
  const usuario = await Usuario.create({ ...datos, password: await bcrypt.hash(datos.password, BCRYPT_RONDAS) });
  res.status(201).json(await buscarOFallar(usuario.id));
}

// PUT /api/usuarios/:id (si llega una contraseña nueva, se vuelve a cifrar)
async function actualizar(req, res) {
  const usuario = await buscarOFallar(req.params.id);
  const datos = datosValidados(req);
  if (datos.correo !== undefined) await verificarCorreoLibre(datos.correo, usuario.id);
  await verificarAsignacion(datos, req.usuario, usuario);
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
