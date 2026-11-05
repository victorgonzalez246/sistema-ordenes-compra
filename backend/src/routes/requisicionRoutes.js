const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/requisicionController');
const v = require('../validators/requisicionValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosRequisicion,
  id: v.idRequisicion,
  crear: v.crearRequisicion,
  actualizar: v.actualizarRequisicion,
});
