const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/ordenController');
const v = require('../validators/ordenValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosOrden,
  id: v.idOrden,
  crear: v.crearOrden,
  actualizar: v.actualizarOrden,
});
