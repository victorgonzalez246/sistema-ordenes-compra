const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/contactoProveedorController');
const v = require('../validators/contactoProveedorValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosContacto,
  id: v.idContacto,
  crear: v.crearContacto,
  actualizar: v.actualizarContacto,
});
