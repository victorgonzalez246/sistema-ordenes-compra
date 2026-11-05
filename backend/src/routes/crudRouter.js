const { Router } = require('express');
const validar = require('../middlewares/validate');

// Router REST estándar: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
function crearRouterCrud(controlador, { listar = [], id, crear, actualizar }) {
  const router = Router();

  router.get('/', ...listar, validar, controlador.listar);
  router.get('/:id', id, validar, controlador.obtener);
  router.post('/', crear, validar, controlador.crear);
  router.put('/:id', actualizar, validar, controlador.actualizar);
  router.delete('/:id', id, validar, controlador.eliminar);

  return router;
}

module.exports = crearRouterCrud;
