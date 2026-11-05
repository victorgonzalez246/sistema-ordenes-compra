const sequelize = require('../config/db');

const Departamento = require('./Departamento');
const Proveedor = require('./Proveedor');
const Producto = require('./Producto');
const OrdenCompra = require('./OrdenCompra');
const DetalleOrden = require('./DetalleOrden');

// Departamento 1:N OrdenCompra (no se borra un departamento con órdenes)
Departamento.hasMany(OrdenCompra, {
  foreignKey: { name: 'departamento_id', allowNull: false },
  as: 'ordenes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
OrdenCompra.belongsTo(Departamento, { foreignKey: 'departamento_id', as: 'departamento' });

// Proveedor 1:N OrdenCompra (no se borra un proveedor con órdenes)
Proveedor.hasMany(OrdenCompra, {
  foreignKey: { name: 'proveedor_id', allowNull: false },
  as: 'ordenes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// OrdenCompra 1:N DetalleOrden (al borrar la orden se borran sus líneas)
OrdenCompra.hasMany(DetalleOrden, {
  foreignKey: { name: 'orden_id', allowNull: false },
  as: 'detalles',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
DetalleOrden.belongsTo(OrdenCompra, { foreignKey: 'orden_id', as: 'orden' });

// Producto 1:N DetalleOrden (no se borra un producto usado en órdenes)
Producto.hasMany(DetalleOrden, {
  foreignKey: { name: 'producto_id', allowNull: false },
  as: 'detalles',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
DetalleOrden.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

module.exports = {
  sequelize,
  Departamento,
  Proveedor,
  Producto,
  OrdenCompra,
  DetalleOrden,
};
