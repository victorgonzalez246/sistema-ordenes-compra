const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ESTADOS_ORDEN = ['pendiente', 'aprobada', 'recibida', 'anulada'];

const OrdenCompra = sequelize.define(
  'OrdenCompra',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_ordenes_compra_numero', msg: 'Ya existe una orden con ese número' },
      validate: { notEmpty: { msg: 'El número de orden es obligatorio' } },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { isDate: { msg: 'La fecha no es válida' } },
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_ORDEN),
      allowNull: false,
      defaultValue: 'pendiente',
      validate: {
        isIn: { args: [ESTADOS_ORDEN], msg: `El estado debe ser uno de: ${ESTADOS_ORDEN.join(', ')}` },
      },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: { args: [0], msg: 'El total no puede ser negativo' } },
    },
  },
  { tableName: 'ordenes_compra' }
);

OrdenCompra.ESTADOS = ESTADOS_ORDEN;

module.exports = OrdenCompra;
