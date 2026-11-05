const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/existenciaController');
const v = require('../validators/existenciaValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosExistencia,
  id: v.idExistencia,
  crear: v.crearExistencia,
  actualizar: v.actualizarExistencia,
});
