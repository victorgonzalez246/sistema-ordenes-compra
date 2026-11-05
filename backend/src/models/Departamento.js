const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Departamento = sequelize.define(
  'Departamento',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    centro_costo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { notEmpty: { msg: 'El centro de costo es obligatorio' } },
    },
    presupuesto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: { args: [0], msg: 'El presupuesto no puede ser negativo' } },
    },
  },
  { tableName: 'departamentos' }
);

module.exports = Departamento;
