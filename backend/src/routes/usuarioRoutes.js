const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/usuarioController');
const v = require('../validators/usuarioValidator');

module.exports = crearRouterCrud(controlador, {
  id: v.idUsuario,
  crear: v.crearUsuario,
  actualizar: v.actualizarUsuario,
});
