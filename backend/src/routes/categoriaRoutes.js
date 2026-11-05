const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/categoriaController');
const v = require('../validators/categoriaValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idCategoria,
  crear: v.crearCategoria,
  actualizar: v.actualizarCategoria,
});
