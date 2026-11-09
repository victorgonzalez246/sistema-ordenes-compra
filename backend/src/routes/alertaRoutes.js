const { Router } = require('express');
const { query } = require('express-validator');
const validar = require('../middlewares/validate');
const controlador = require('../controllers/inventarioController');
const { filtroId, filtroOpcion } = require('../validators/comunes');
const { ESTADOS } = require('../models/AlertaReorden');

const router = Router();

// Materiales en o bajo el punto de reorden, calculado en el momento
router.get(
  '/reorden',
  query('incluir_ok').optional().isBoolean().withMessage('incluir_ok debe ser true o false').toBoolean(),
  validar,
  controlador.reorden
);

// Historial de alertas guardadas (se abren y cierran solas con los movimientos)
router.get('/', filtroOpcion('estado', ESTADOS), filtroId('producto_id'), validar, controlador.listarAlertas);

module.exports = router;
