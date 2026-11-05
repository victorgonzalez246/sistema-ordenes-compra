const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/departamentoController');
const v = require('../validators/departamentoValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idDepartamento,
  crear: v.crearDepartamento,
  actualizar: v.actualizarDepartamento,
});
