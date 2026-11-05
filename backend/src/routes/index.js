const { Router } = require('express');
const proveedorRoutes = require('./proveedorRoutes');

const router = Router();

// Estado del servicio
router.get('/', (req, res) => {
  res.json({ servicio: 'API de Órdenes de Compra', estado: 'ok' });
});

router.use('/proveedores', proveedorRoutes);

module.exports = router;
