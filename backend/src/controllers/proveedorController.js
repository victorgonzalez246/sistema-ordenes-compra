const { Proveedor, OrdenCompra } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');

module.exports = crearControladorCrud(Proveedor, {
  articulo: 'un proveedor',
  orden: [['razon_social', 'ASC']],
  async antesDeEliminar(proveedor) {
    const ordenes = await OrdenCompra.count({ where: { proveedor_id: proveedor.id } });
    if (ordenes > 0) {
      throw new HttpError(
        409,
        `No se puede eliminar el proveedor: tiene ${ordenes} orden(es) de compra asociada(s)`,
        [{ campo: 'id', mensaje: 'Puedes marcarlo como inactivo (activo: false) en lugar de eliminarlo' }]
      );
    }
  },
});
