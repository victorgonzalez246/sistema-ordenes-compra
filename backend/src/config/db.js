require('dotenv').config({ quiet: true });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    // Devuelve los DECIMAL como números y no como cadenas
    dialectOptions: { decimalNumbers: true },
    define: {
      timestamps: true,
      underscored: true, // columnas y FK en snake_case
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = sequelize;
