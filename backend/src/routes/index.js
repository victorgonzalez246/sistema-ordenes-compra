const { Router } = require('express');

const router = Router();

// Estado del servicio
router.get('/', (req, res) => {
  res.json({ servicio: 'API de Órdenes de Compra', estado: 'ok' });
});

router.use('/departamentos', require('./departamentoRoutes'));
router.use('/proveedores', require('./proveedorRoutes'));
router.use('/productos', require('./productoRoutes'));
router.use('/ordenes', require('./ordenRoutes'));

module.exports = router;
