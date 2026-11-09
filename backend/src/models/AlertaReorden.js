const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ESTADOS_ALERTA = ['abierta', 'cerrada'];
const PRIORIDADES_ALERTA = ['urgente', 'reponer'];

/**
 * Aviso de que un material llegó a su punto de reorden.
 * Se abre sola cuando un movimiento deja el stock en o bajo el punto de reorden,
 * se actualiza mientras siga bajo, y se cierra sola cuando el stock se recupera.
 * Hay a lo sumo una alerta abierta por material.
 */
const AlertaReorden = sequelize.define(
  'AlertaReorden',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    estado: { type: DataTypes.ENUM(...ESTADOS_ALERTA), allowNull: false, defaultValue: 'abierta' },
    prioridad: { type: DataTypes.ENUM(...PRIORIDADES_ALERTA), allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false },
    punto_reorden: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    cantidad_sugerida: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cerrada_en: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'alertas_reorden' }
);

AlertaReorden.ESTADOS = ESTADOS_ALERTA;

module.exports = AlertaReorden;
