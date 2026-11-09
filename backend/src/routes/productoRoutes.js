const { Router } = require('express');
const validar = require('../middlewares/validate');
const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/productoController');
const inventario = require('../controllers/inventarioController');
const v = require('../validators/productoValidator');
const { filtroId } = require('../validators/comunes');

const router = Router();

// Consultas de inventario de un material
router.get('/:id/stock', v.idProducto, validar, inventario.stock);
router.get('/:id/trazabilidad', v.idProducto, filtroId('bodega_id'), validar, inventario.trazabilidad);

router.use(
  crearRouterCrud(controlador, {
    listar: v.filtrosProducto,
    id: v.idProducto,
    crear: v.crearProducto,
    actualizar: v.actualizarProducto,
  })
);

module.exports = router;
