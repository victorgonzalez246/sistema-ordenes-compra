const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ESTADOS = ['pendiente', 'pagada', 'anulada'];

// Factura que envía el proveedor por una orden de compra
const Factura = sequelize.define(
  'Factura',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_facturas_numero', msg: 'Ya existe una factura con ese número' },
      validate: { notEmpty: { msg: 'El número es obligatorio' } },
    },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'El monto debe ser mayor que 0' } },
    },
    // Suma de los pagos registrados; la calcula el servidor
    pagado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    estado: { type: DataTypes.ENUM(...ESTADOS), allowNull: false, defaultValue: 'pendiente' },
  },
  { tableName: 'facturas' }
);

Factura.ESTADOS = ESTADOS;

module.exports = Factura;
