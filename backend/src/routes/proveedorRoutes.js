const { Router } = require('express');
const controlador = require('../controllers/proveedorController');
const validar = require('../middlewares/validate');
const {
  crearProveedor,
  actualizarProveedor,
  idProveedor,
} = require('../validators/proveedorValidator');

const router = Router();

router.get('/', controlador.listar);
router.get('/:id', idProveedor, validar, controlador.obtener);
router.post('/', crearProveedor, validar, controlador.crear);
router.put('/:id', actualizarProveedor, validar, controlador.actualizar);
router.delete('/:id', idProveedor, validar, controlador.eliminar);

module.exports = router;
