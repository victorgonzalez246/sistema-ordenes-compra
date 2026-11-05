const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/cotizacionController');
const v = require('../validators/cotizacionValidator');

module.exports = crearRouterCrud(controlador, {
  listar: v.filtrosCotizacion,
  id: v.idCotizacion,
  crear: v.crearCotizacion,
  actualizar: v.actualizarCotizacion,
});
