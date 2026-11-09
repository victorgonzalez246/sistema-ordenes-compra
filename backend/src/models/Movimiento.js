const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'traslado', 'ajuste'];
const DOCUMENTOS = ['orden_compra', 'inventario_inicial', 'vale_salida', 'boleta_traslado', 'ajuste_inventario'];

/**
 * Cada cambio de inventario queda como un movimiento. El stock de un material en una bodega
 * es la suma de lo que entró (bodega_destino) menos lo que salió (bodega_origen).
 * Los movimientos no se editan ni se borran: un error se corrige con un ajuste.
 *
 *   entrada:  solo destino     (compra recibida o inventario inicial)
 *   salida:   solo origen      (consumo en obra, vale de salida)
 *   traslado: origen y destino (de una bodega u obra a otra)
 *   ajuste:   origen o destino (conteo físico: faltante sale del origen, sobrante entra al destino)
 */
const Movimiento = sequelize.define(
  'Movimiento',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tipo: { type: DataTypes.ENUM(...TIPOS_MOVIMIENTO), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: { args: [1], msg: 'La cantidad debe ser mayor que 0' } },
    },
    documento_tipo: { type: DataTypes.ENUM(...DOCUMENTOS), allowNull: false },
    documento_numero: { type: DataTypes.STRING(40), allowNull: false },
    observaciones: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'movimientos',
    updatedAt: false,
    indexes: [
      { name: 'ix_movimientos_producto_fecha', fields: ['producto_id', 'fecha'] },
    ],
  }
);

Movimiento.TIPOS = TIPOS_MOVIMIENTO;
Movimiento.DOCUMENTOS = DOCUMENTOS;

module.exports = Movimiento;
