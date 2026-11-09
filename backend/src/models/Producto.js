const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { parametrosReorden } = require('../services/reorden');

const noNegativo = (etiqueta) => ({ args: [0], msg: `${etiqueta} no puede ser negativo(a)` });

const Producto = sequelize.define(
  'Producto',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_productos_codigo', msg: 'Ya existe un producto con ese código' },
      validate: { notEmpty: { msg: 'El código es obligatorio' } },
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    unidad: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { notEmpty: { msg: 'La unidad es obligatoria' } },
    },
    precio_ref: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: { args: [0], msg: 'El precio de referencia no puede ser negativo' } },
    },

    // Parámetros de inventario (el punto de reorden se calcula con ellos, no se digita)
    stock_minimo: { type: DataTypes.INTEGER, allowNull: true, validate: { min: noNegativo('El stock mínimo') } },
    stock_maximo: { type: DataTypes.INTEGER, allowNull: true, validate: { min: noNegativo('El stock máximo') } },
    demanda_promedio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: noNegativo('La demanda promedio') },
    },
    demanda_maxima: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: noNegativo('La demanda máxima') },
    },
    tiempo_entrega: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Días que tarda el proveedor en entregar',
      validate: { min: noNegativo('El tiempo de entrega') },
    },

    // Campos calculados: aparecen en las respuestas pero no se guardan
    stock_seguridad: {
      type: DataTypes.VIRTUAL,
      get() {
        return parametrosReorden(this.dataValues).stock_seguridad;
      },
    },
    punto_reorden: {
      type: DataTypes.VIRTUAL,
      get() {
        return parametrosReorden(this.dataValues).punto_reorden;
      },
    },
  },
  { tableName: 'productos' }
);

module.exports = Producto;
