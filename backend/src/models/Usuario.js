const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Persona que puede entrar al sistema. La contraseña se guarda solo como hash de bcrypt.
const Usuario = sequelize.define(
  'Usuario',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    correo: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: { name: 'uq_usuarios_correo', msg: 'Ya existe una cuenta con ese correo' },
      validate: { isEmail: { msg: 'El correo no tiene un formato válido' } },
    },
    password: {
      type: DataTypes.STRING(72),
      allowNull: false,
    },
  },
  {
    tableName: 'usuarios',
    createdAt: 'fecha_creacion',
    // Por defecto nunca se lee la contraseña; el login usa el scope "conPassword"
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { conPassword: { attributes: { include: ['password'] } } },
  }
);

// Respaldo: aunque una consulta traiga el hash, nunca sale en una respuesta JSON
Usuario.prototype.toJSON = function toJSON() {
  // eslint-disable-next-line no-unused-vars
  const { password, ...datos } = this.get({ plain: true });
  return datos;
};

module.exports = Usuario;
