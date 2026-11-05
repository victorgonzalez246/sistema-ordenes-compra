const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/proveedorController');
const v = require('../validators/proveedorValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idProveedor,
  crear: v.crearProveedor,
  actualizar: v.actualizarProveedor,
});
