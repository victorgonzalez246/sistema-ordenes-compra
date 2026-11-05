const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/facturaController');
const v = require('../validators/facturaValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosFactura,
  id: v.idFactura,
  crear: v.crearFactura,
  actualizar: v.actualizarFactura,
});
