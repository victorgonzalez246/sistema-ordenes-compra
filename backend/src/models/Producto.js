const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define(
  'Producto',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_productos_codigo', msg: 'Ya existe un producto con ese código' },
      validate: { notEmpty: { msg: 'El código es obligatorio' } },
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    unidad: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { notEmpty: { msg: 'La unidad es obligatoria' } },
    },
    precio_ref: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: { args: [0], msg: 'El precio de referencia no puede ser negativo' } },
    },
  },
  { tableName: 'productos' }
);

module.exports = Producto;
