const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Persona de contacto dentro de un proveedor (ventas, cobros, soporte)
const ContactoProveedor = sequelize.define(
  'ContactoProveedor',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    puesto: { type: DataTypes.STRING(80), allowNull: true },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { isEmail: { msg: 'El email no tiene un formato válido' } },
    },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    principal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'contactos_proveedor' }
);

module.exports = ContactoProveedor;
