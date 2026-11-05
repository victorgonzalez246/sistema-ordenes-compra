const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/recepcionController');
const v = require('../validators/recepcionValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosRecepcion,
  id: v.idRecepcion,
  crear: v.crearRecepcion,
  actualizar: v.actualizarRecepcion,
});
