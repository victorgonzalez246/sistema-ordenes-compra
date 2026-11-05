const { Router } = require('express');
const validar = require('../middlewares/validate');
const { limiteAsistente } = require('../middlewares/limiteUso');
const controlador = require('../controllers/asistenteController');
const v = require('../validators/asistenteValidator');

// Montadas después del middleware de autenticación: requieren token
const router = Router();
router.get('/estado', controlador.estado);
// El límite va primero: cada pregunta cuesta dinero en la API de Anthropic
router.post('/', limiteAsistente, v.preguntar, validar, controlador.preguntar);

module.exports = router;
