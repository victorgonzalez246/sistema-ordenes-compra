const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DetalleOrden = sequelize.define(
  'DetalleOrden',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'La cantidad debe ser un número entero' },
        min: { args: [1], msg: 'La cantidad debe ser mayor que 0' },
      },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'El precio unitario no puede ser negativo' } },
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'detalles_orden',
    hooks: {
      // El subtotal siempre se calcula a partir de cantidad x precio
      beforeValidate(detalle) {
        if (detalle.cantidad != null && detalle.precio_unitario != null) {
          detalle.subtotal = Number((detalle.cantidad * detalle.precio_unitario).toFixed(2));
        }
      },
    },
  }
);

module.exports = DetalleOrden;
