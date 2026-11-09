const { Router } = require('express');
const { query } = require('express-validator');
const validar = require('../middlewares/validate');
const crearRouterCrud = require('./crudRouter');
const controlador = require('../controllers/ordenController');
const duplicados = require('../controllers/duplicadosController');
const v = require('../validators/ordenValidator');

const router = Router();

// Va antes de /:id para que "posibles-duplicados" no se lea como un id
router.get(
  '/posibles-duplicados',
  query('dias').optional().isInt({ min: 0, max: 365 }).withMessage('dias debe ser un entero entre 0 y 365').toInt(),
  query('tolerancia').optional().isFloat({ min: 0, max: 100 }).withMessage('tolerancia debe ser un porcentaje entre 0 y 100').toFloat(),
  query(['desde', 'hasta']).optional().isISO8601({ strict: true }).withMessage('Las fechas deben tener el formato AAAA-MM-DD'),
  validar,
  duplicados.posiblesDuplicados
);

// Qué pide la matriz de aprobación para esta orden y si el usuario actual puede aprobarla
router.get('/:id/aprobacion', v.idOrden, validar, controlador.aprobacion);

router.use(
  crearRouterCrud(controlador, {
    listar: v.filtrosOrden,
    id: v.idOrden,
    crear: v.crearOrden,
    actualizar: v.actualizarOrden,
  })
);

module.exports = router;
