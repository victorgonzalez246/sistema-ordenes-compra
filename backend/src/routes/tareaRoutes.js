const { Router } = require('express');
const tareas = require('../services/tareas');

const router = Router();

// Lanza ahora la revisión diaria (la misma que corre sola cada mañana)
router.post('/revision-diaria', async (req, res) => {
  res.json(await tareas.revisionDiaria());
});

// Resultado de la última revisión desde que arrancó el servidor
router.get('/revision-diaria', (req, res) => {
  res.json(tareas.ultima() ?? { mensaje: 'Todavía no se ha ejecutado la revisión diaria' });
});

module.exports = router;
