const { matchedData } = require('express-validator');
const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');

/**
 * Genera los cinco manejadores CRUD de un modelo.
 * @param Modelo            modelo de Sequelize
 * @param articulo          texto para los mensajes, por ejemplo "un proveedor"
 * @param orden             orden del listado
 * @param incluir           relaciones que se devuelven junto con cada registro
 * @param antesDeGuardar    async (datos, actual) => lanza HttpError si los datos rompen una regla;
 *                          actual es null al crear
 * @param despuesDeGuardar  async (registro, previo) => acciones posteriores (previo: valores antes del cambio)
 * @param antesDeEliminar   async (registro) => lanza HttpError si el registro no se puede borrar
 * @param despuesDeEliminar async (registro) => acciones posteriores al borrado
 */
function crearControladorCrud(
  Modelo,
  { articulo, orden = [['id', 'ASC']], incluir = [], antesDeGuardar, despuesDeGuardar, antesDeEliminar, despuesDeEliminar }
) {
  async function buscarOFallar(id) {
    const registro = await Modelo.findByPk(id, { include: incluir });
    if (!registro) throw new HttpError(404, `No existe ${articulo} con id ${id}`);
    return registro;
  }

  return {
    // Los filtros del query (?estado=, ?proveedor_id=) llegan ya validados
    async listar(req, res) {
      const where = matchedData(req, { locations: ['query'] });
      res.json(await Modelo.findAll({ where, include: incluir, order: orden }));
    },

    async obtener(req, res) {
      res.json(await buscarOFallar(req.params.id));
    },

    async crear(req, res) {
      const datos = datosValidados(req);
      if (antesDeGuardar) await antesDeGuardar(datos, null);
      const creado = await Modelo.create(datos);
      if (despuesDeGuardar) await despuesDeGuardar(creado, null);
      res.status(201).json(await buscarOFallar(creado.id));
    },

    async actualizar(req, res) {
      const registro = await buscarOFallar(req.params.id);
      const datos = datosValidados(req);
      const previo = registro.get({ plain: true });
      if (antesDeGuardar) await antesDeGuardar(datos, registro);
      await registro.update(datos);
      if (despuesDeGuardar) await despuesDeGuardar(registro, previo);
      res.json(await buscarOFallar(registro.id));
    },

    async eliminar(req, res) {
      const registro = await buscarOFallar(req.params.id);
      if (antesDeEliminar) await antesDeEliminar(registro);
      await registro.destroy();
      if (despuesDeEliminar) await despuesDeEliminar(registro);
      res.status(204).end();
    },
  };
}

module.exports = crearControladorCrud;
