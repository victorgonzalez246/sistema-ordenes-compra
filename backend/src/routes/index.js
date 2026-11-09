const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');

const router = Router();

// Estado del servicio (público)
router.get('/', (req, res) => {
  res.json({ servicio: 'API de Órdenes de Compra', estado: 'ok' });
});

// Registro, login y perfil
router.use('/auth', require('./authRoutes'));

// Desde aquí, todas las rutas exigen un token válido (401 si no lo hay)
router.use(autenticar);

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
router.use('/movimientos', require('./movimientoRoutes'));
router.use('/alertas', require('./alertaRoutes'));
router.use('/tareas', require('./tareaRoutes'));

// Cuentas por pagar
router.use('/facturas', require('./facturaRoutes'));
router.use('/pagos', require('./pagoRoutes'));
router.use('/metodos-pago', require('./metodoPagoRoutes'));

// Seguridad
router.use('/usuarios', require('./usuarioRoutes'));

// Asistente con IA (cerebro + agentes)
router.use('/asistente', require('./asistenteRoutes'));

module.exports = router;
