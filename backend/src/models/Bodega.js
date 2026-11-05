const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Lugar donde se recibe y almacena la mercancía comprada
const Bodega = sequelize.define(
  'Bodega',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: { name: 'uq_bodegas_nombre', msg: 'Ya existe una bodega con ese nombre' },
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    ubicacion: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: { msg: 'La ubicación es obligatoria' } },
    },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'bodegas' }
);

module.exports = Bodega;
