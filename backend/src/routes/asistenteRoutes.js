const { Router } = require('express');
const validar = require('../middlewares/validate');
const controlador = require('../controllers/asistenteController');
const v = require('../validators/asistenteValidator');

// Montadas después del middleware de autenticación: requieren token
const router = Router();
router.get('/estado', controlador.estado);
router.post('/', v.preguntar, validar, controlador.preguntar);

module.exports = router;
