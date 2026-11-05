const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/pagoController');
const v = require('../validators/pagoValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosPago,
  id: v.idPago,
  crear: v.crearPago,
  actualizar: v.actualizarPago,
});
