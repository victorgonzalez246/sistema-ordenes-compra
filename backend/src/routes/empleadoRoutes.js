const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/empleadoController');
const v = require('../validators/empleadoValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosEmpleado,
  id: v.idEmpleado,
  crear: v.crearEmpleado,
  actualizar: v.actualizarEmpleado,
});
