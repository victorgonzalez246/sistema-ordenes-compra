const { Producto, Categoria, DetalleOrden, Existencia, Cotizacion } = require('../models');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, sinDependencias } = require('./reglas');

module.exports = crearControladorCrud(Producto, {
  articulo: 'un producto',
  orden: [['codigo', 'ASC']],
  incluir: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
  async antesDeGuardar(datos) {
    await verificarReferencias(datos, [{ campo: 'categoria_id', Modelo: Categoria, nombre: 'una categoría' }]);
  },
  antesDeEliminar: sinDependencias('el producto', [
    { Modelo: DetalleOrden, campo: 'producto_id', texto: 'línea(s) en órdenes de compra' },
    { Modelo: Existencia, campo: 'producto_id', texto: 'existencia(s) en bodegas' },
    { Modelo: Cotizacion, campo: 'producto_id', texto: 'cotización(es) registrada(s)' },
  ]),
});
