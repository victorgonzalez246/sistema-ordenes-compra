const { Router } = require('express');

const router = Router();

// Estado del servicio
router.get('/', (req, res) => {
  res.json({ servicio: 'API de Órdenes de Compra', estado: 'ok' });
});

// Organización
router.use('/departamentos', require('./departamentoRoutes'));
router.use('/empleados', require('./empleadoRoutes'));

// Catálogos
router.use('/proveedores', require('./proveedorRoutes'));
router.use('/contactos-proveedor', require('./contactoProveedorRoutes'));
router.use('/categorias', require('./categoriaRoutes'));
router.use('/productos', require('./productoRoutes'));

// Compras
router.use('/requisiciones', require('./requisicionRoutes'));
router.use('/cotizaciones', require('./cotizacionRoutes'));
router.use('/ordenes', require('./ordenRoutes'));
router.use('/recepciones', require('./recepcionRoutes'));

// Inventario
router.use('/bodegas', require('./bodegaRoutes'));
router.use('/existencias', require('./existenciaRoutes'));

// Cuentas por pagar
router.use('/facturas', require('./facturaRoutes'));
router.use('/pagos', require('./pagoRoutes'));
router.use('/metodos-pago', require('./metodoPagoRoutes'));

module.exports = router;
