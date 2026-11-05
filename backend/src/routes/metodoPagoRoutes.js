const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/metodoPagoController');
const v = require('../validators/metodoPagoValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idMetodoPago,
  crear: v.crearMetodoPago,
  actualizar: v.actualizarMetodoPago,
});
