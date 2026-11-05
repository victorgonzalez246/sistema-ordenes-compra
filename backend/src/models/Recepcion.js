const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Registro de la mercancía de una orden que llegó a una bodega
const Recepcion = sequelize.define(
  'Recepcion',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    observaciones: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'recepciones' }
);

module.exports = Recepcion;
