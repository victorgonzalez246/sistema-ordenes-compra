const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/bodegaController');
const v = require('../validators/bodegaValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idBodega,
  crear: v.crearBodega,
  actualizar: v.actualizarBodega,
});
