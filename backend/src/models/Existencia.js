const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Cantidad disponible de un producto en una bodega (una fila por par producto-bodega)
const Existencia = sequelize.define(
  'Existencia',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: { args: [0], msg: 'La cantidad no puede ser negativa' } },
    },
    minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: { args: [0], msg: 'El mínimo no puede ser negativo' } },
    },
  },
  {
    tableName: 'existencias',
    indexes: [{ unique: true, name: 'uq_existencias_producto_bodega', fields: ['producto_id', 'bodega_id'] }],
  }
);

module.exports = Existencia;
