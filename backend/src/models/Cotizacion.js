const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Precio que ofrece un proveedor por un producto, válido hasta una fecha
const Cotizacion = sequelize.define(
  'Cotizacion',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    vigencia_hasta: { type: DataTypes.DATEONLY, allowNull: false },
    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'El precio no puede ser negativo' } },
    },
    dias_entrega: { type: DataTypes.INTEGER, allowNull: true },
    observaciones: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'cotizaciones' }
);

module.exports = Cotizacion;
