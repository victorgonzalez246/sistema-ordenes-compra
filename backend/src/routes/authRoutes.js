const { Router } = require('express');
const validar = require('../middlewares/validate');
const autenticar = require('../middlewares/authMiddleware');
const controlador = require('../controllers/authController');
const v = require('../validators/authValidator');
const { limiteLogin } = require('../middlewares/limiteUso');

const router = Router();

// Públicas
router.post('/register', v.registro, validar, controlador.registrar);
router.post('/login', limiteLogin, v.login, validar, controlador.iniciarSesion);

// Requiere token
router.get('/me', autenticar, controlador.perfil);

module.exports = router;
