const { Categoria, Producto } = require('../models');
const crearControladorCrud = require('./crudController');
const { sinDependencias } = require('./reglas');

module.exports = crearControladorCrud(Categoria, {
  articulo: 'una categoría',
  orden: [['nombre', 'ASC']],
  antesDeEliminar: sinDependencias('la categoría', [
    { Modelo: Producto, campo: 'categoria_id', texto: 'producto(s) asociado(s)' },
  ]),
});
