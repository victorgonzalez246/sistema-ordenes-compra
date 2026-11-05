const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Pago (total o parcial) de una factura de proveedor
const Pago = sequelize.define(
  'Pago',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'El monto debe ser mayor que 0' } },
    },
    referencia: { type: DataTypes.STRING(60), allowNull: true },
  },
  { tableName: 'pagos' }
);

module.exports = Pago;
