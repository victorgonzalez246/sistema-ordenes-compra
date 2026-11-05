const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Persona de un departamento que solicita compras o recibe mercancía
const Empleado = sequelize.define(
  'Empleado',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cedula: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: { name: 'uq_empleados_cedula', msg: 'Ya existe un empleado con esa cédula' },
      validate: { notEmpty: { msg: 'La cédula es obligatoria' } },
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    puesto: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: { msg: 'El puesto es obligatorio' } },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { isEmail: { msg: 'El email no tiene un formato válido' } },
    },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'empleados' }
);

module.exports = Empleado;
