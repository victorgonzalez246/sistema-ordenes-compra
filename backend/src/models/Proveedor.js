const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define(
  'Proveedor',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    razon_social: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'La razón social es obligatoria' } },
    },
    cedula_juridica: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { name: 'uq_proveedores_cedula_juridica', msg: 'Ya existe un proveedor con esa cédula jurídica' },
      validate: { notEmpty: { msg: 'La cédula jurídica es obligatoria' } },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { isEmail: { msg: 'El email no tiene un formato válido' } },
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: 'proveedores' }
);

module.exports = Proveedor;
