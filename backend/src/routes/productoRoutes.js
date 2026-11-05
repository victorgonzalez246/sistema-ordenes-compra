const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/productoController');
const v = require('../validators/productoValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idProducto,
  crear: v.crearProducto,
  actualizar: v.actualizarProducto,
});
