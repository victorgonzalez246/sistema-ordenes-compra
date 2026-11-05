const { HttpError } = require('../middlewares/errorHandler');
const { datosValidados } = require('../validators/comunes');

/**
 * Genera los cinco manejadores CRUD de un modelo simple.
 * @param Modelo        modelo de Sequelize
 * @param articulo      texto para los mensajes, por ejemplo "un proveedor"
 * @param orden         orden del listado
 * @param antesDeEliminar función async que lanza HttpError si el registro no se puede borrar
 */
function crearControladorCrud(Modelo, { articulo, orden = [['id', 'ASC']], antesDeEliminar }) {
  async function buscarOFallar(id) {
    const registro = await Modelo.findByPk(id);
    if (!registro) throw new HttpError(404, `No existe ${articulo} con id ${id}`);
    return registro;
  }

  return {
    async listar(req, res) {
      res.json(await Modelo.findAll({ order: orden }));
    },

    async obtener(req, res) {
      res.json(await buscarOFallar(req.params.id));
    },

    async crear(req, res) {
      const registro = await Modelo.create(datosValidados(req));
      res.status(201).json(registro);
    },

    async actualizar(req, res) {
      const registro = await buscarOFallar(req.params.id);
      await registro.update(datosValidados(req));
      res.json(registro);
    },

    async eliminar(req, res) {
      const registro = await buscarOFallar(req.params.id);
      if (antesDeEliminar) await antesDeEliminar(registro);
      await registro.destroy();
      res.status(204).end();
    },
  };
}

module.exports = crearControladorCrud;
