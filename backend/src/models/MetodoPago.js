const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Forma en que se paga a los proveedores (transferencia, SINPE, cheque…)
const MetodoPago = sequelize.define(
  'MetodoPago',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: { name: 'uq_metodos_pago_nombre', msg: 'Ya existe un método de pago con ese nombre' },
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'metodos_pago' }
);

module.exports = MetodoPago;
