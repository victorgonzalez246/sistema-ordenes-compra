const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Agrupa los productos del catálogo (papelería, tecnología, ferretería…)
const Categoria = sequelize.define(
  'Categoria',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: { name: 'uq_categorias_nombre', msg: 'Ya existe una categoría con ese nombre' },
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'categorias' }
);

module.exports = Categoria;
