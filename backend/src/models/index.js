const sequelize = require('../config/db');

const Departamento = require('./Departamento');
const Proveedor = require('./Proveedor');
const Producto = require('./Producto');
const OrdenCompra = require('./OrdenCompra');
const DetalleOrden = require('./DetalleOrden');
const Categoria = require('./Categoria');
const MetodoPago = require('./MetodoPago');
const Empleado = require('./Empleado');
const Bodega = require('./Bodega');
const ContactoProveedor = require('./ContactoProveedor');
const Cotizacion = require('./Cotizacion');
const Existencia = require('./Existencia');
const Requisicion = require('./Requisicion');
const Recepcion = require('./Recepcion');
const Factura = require('./Factura');
const Pago = require('./Pago');
const Usuario = require('./Usuario');
const Movimiento = require('./Movimiento');
const AlertaReorden = require('./AlertaReorden');

/**
 * Relación 1:N entre dos modelos.
 * onDelete: RESTRICT (no se borra el padre con hijos), CASCADE (se borran los hijos)
 * o SET NULL (el hijo queda sin padre; la FK debe admitir null).
 */
function unoAMuchos(Padre, Hijo, { fk, comoHijos, comoPadre, onDelete = 'RESTRICT', nulo = false }) {
  Padre.hasMany(Hijo, {
    foreignKey: { name: fk, allowNull: nulo },
    as: comoHijos,
    onDelete,
    onUpdate: 'CASCADE',
  });
  Hijo.belongsTo(Padre, { foreignKey: fk, as: comoPadre });
}

// Órdenes de compra
unoAMuchos(Departamento, OrdenCompra, { fk: 'departamento_id', comoHijos: 'ordenes', comoPadre: 'departamento' });
unoAMuchos(Proveedor, OrdenCompra, { fk: 'proveedor_id', comoHijos: 'ordenes', comoPadre: 'proveedor' });
unoAMuchos(OrdenCompra, DetalleOrden, { fk: 'orden_id', comoHijos: 'detalles', comoPadre: 'orden', onDelete: 'CASCADE' });
unoAMuchos(Producto, DetalleOrden, { fk: 'producto_id', comoHijos: 'detalles', comoPadre: 'producto' });

// Catálogos
unoAMuchos(Categoria, Producto, { fk: 'categoria_id', comoHijos: 'productos', comoPadre: 'categoria', nulo: true });
unoAMuchos(Departamento, Empleado, { fk: 'departamento_id', comoHijos: 'empleados', comoPadre: 'departamento' });
unoAMuchos(Proveedor, ContactoProveedor, { fk: 'proveedor_id', comoHijos: 'contactos', comoPadre: 'proveedor', onDelete: 'CASCADE' });

// Compras
unoAMuchos(Empleado, Requisicion, { fk: 'empleado_id', comoHijos: 'requisiciones', comoPadre: 'empleado' });
unoAMuchos(Proveedor, Cotizacion, { fk: 'proveedor_id', comoHijos: 'cotizaciones', comoPadre: 'proveedor', onDelete: 'CASCADE' });
unoAMuchos(Producto, Cotizacion, { fk: 'producto_id', comoHijos: 'cotizaciones', comoPadre: 'producto' });
unoAMuchos(OrdenCompra, Recepcion, { fk: 'orden_id', comoHijos: 'recepciones', comoPadre: 'orden' });
unoAMuchos(Bodega, Recepcion, { fk: 'bodega_id', comoHijos: 'recepciones', comoPadre: 'bodega' });
unoAMuchos(Empleado, Recepcion, { fk: 'empleado_id', comoHijos: 'recepciones', comoPadre: 'empleado' });

// Inventario
unoAMuchos(Empleado, Bodega, { fk: 'responsable_id', comoHijos: 'bodegas', comoPadre: 'responsable', onDelete: 'SET NULL', nulo: true });
unoAMuchos(Producto, Existencia, { fk: 'producto_id', comoHijos: 'existencias', comoPadre: 'producto' });
unoAMuchos(Bodega, Existencia, { fk: 'bodega_id', comoHijos: 'existencias', comoPadre: 'bodega' });

// Movimientos de inventario (el stock se calcula a partir de ellos)
unoAMuchos(Producto, Movimiento, { fk: 'producto_id', comoHijos: 'movimientos', comoPadre: 'producto' });
unoAMuchos(Bodega, Movimiento, { fk: 'bodega_origen_id', comoHijos: 'salidas', comoPadre: 'bodega_origen', nulo: true });
unoAMuchos(Bodega, Movimiento, { fk: 'bodega_destino_id', comoHijos: 'entradas', comoPadre: 'bodega_destino', nulo: true });
unoAMuchos(Usuario, Movimiento, { fk: 'usuario_id', comoHijos: 'movimientos', comoPadre: 'usuario' });
unoAMuchos(OrdenCompra, Movimiento, { fk: 'orden_id', comoHijos: 'movimientos', comoPadre: 'orden', nulo: true });
unoAMuchos(Recepcion, Movimiento, { fk: 'recepcion_id', comoHijos: 'movimientos', comoPadre: 'recepcion', nulo: true });

// Matriz de aprobación: departamento de cada usuario (para la jefatura de área) y quién aprobó cada orden
unoAMuchos(Departamento, Usuario, { fk: 'departamento_id', comoHijos: 'usuarios', comoPadre: 'departamento', onDelete: 'SET NULL', nulo: true });
unoAMuchos(Usuario, OrdenCompra, { fk: 'aprobada_por_id', comoHijos: 'ordenes_aprobadas', comoPadre: 'aprobada_por', onDelete: 'SET NULL', nulo: true });

// Alertas de reorden (a lo sumo una abierta por material)
unoAMuchos(Producto, AlertaReorden, { fk: 'producto_id', comoHijos: 'alertas', comoPadre: 'producto', onDelete: 'CASCADE' });
unoAMuchos(Movimiento, AlertaReorden, { fk: 'movimiento_id', comoHijos: 'alertas', comoPadre: 'movimiento', onDelete: 'SET NULL', nulo: true });

// Cuentas por pagar
unoAMuchos(OrdenCompra, Factura, { fk: 'orden_id', comoHijos: 'facturas', comoPadre: 'orden' });
unoAMuchos(Factura, Pago, { fk: 'factura_id', comoHijos: 'pagos', comoPadre: 'factura' });
unoAMuchos(MetodoPago, Pago, { fk: 'metodo_pago_id', comoHijos: 'pagos', comoPadre: 'metodo_pago' });

module.exports = {
  sequelize,
  Departamento,
  Proveedor,
  Producto,
  OrdenCompra,
  DetalleOrden,
  Categoria,
  MetodoPago,
  Empleado,
  Bodega,
  ContactoProveedor,
  Cotizacion,
  Existencia,
  Requisicion,
  Recepcion,
  Factura,
  Pago,
  Usuario,
  Movimiento,
  AlertaReorden,
};
