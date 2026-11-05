const { Producto, DetalleOrden } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');

module.exports = crearControladorCrud(Producto, {
  articulo: 'un producto',
  orden: [['codigo', 'ASC']],
  async antesDeEliminar(producto) {
    const lineas = await DetalleOrden.count({ where: { producto_id: producto.id } });
    if (lineas > 0) {
      throw new HttpError(
        409,
        `No se puede eliminar el producto: aparece en ${lineas} línea(s) de órdenes de compra`
      );
    }
  },
});
