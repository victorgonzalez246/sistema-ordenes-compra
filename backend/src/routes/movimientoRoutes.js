const { Router } = require('express');
const validar = require('../middlewares/validate');
const controlador = require('../controllers/movimientoController');
const v = require('../validators/movimientoValidator');

// Los movimientos no se editan ni se borran: un error se corrige con un movimiento de ajuste
const router = Router();
router.get('/', v.filtrosMovimiento, validar, controlador.listar);
router.get('/:id', v.idMovimiento, validar, controlador.obtener);
router.post('/', v.crearMovimiento, validar, controlador.crear);

module.exports = router;
