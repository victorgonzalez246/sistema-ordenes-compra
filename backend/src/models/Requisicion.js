const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ESTADOS = ['pendiente', 'aprobada', 'rechazada'];
const PRIORIDADES = ['baja', 'media', 'alta'];

// Solicitud interna de compra que hace un empleado antes de emitir la orden
const Requisicion = sequelize.define(
  'Requisicion',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_requisiciones_numero', msg: 'Ya existe una requisición con ese número' },
      validate: { notEmpty: { msg: 'El número es obligatorio' } },
    },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: 'La descripción es obligatoria' } },
    },
    prioridad: { type: DataTypes.ENUM(...PRIORIDADES), allowNull: false, defaultValue: 'media' },
    monto_estimado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: { min: { args: [0], msg: 'El monto estimado no puede ser negativo' } },
    },
    estado: { type: DataTypes.ENUM(...ESTADOS), allowNull: false, defaultValue: 'pendiente' },
  },
  { tableName: 'requisiciones' }
);

Requisicion.ESTADOS = ESTADOS;
Requisicion.PRIORIDADES = PRIORIDADES;

module.exports = Requisicion;
