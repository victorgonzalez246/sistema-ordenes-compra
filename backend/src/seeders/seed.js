require('dotenv').config({ quiet: true });
const { sequelize, Departamento, Proveedor, Producto } = require('../models');

const departamentos = [
  { nombre: 'Tecnología de la Información', centro_costo: 'CC-100', presupuesto: 85000.0 },
  { nombre: 'Mantenimiento y Servicios Generales', centro_costo: 'CC-200', presupuesto: 42000.0 },
  { nombre: 'Administración y Finanzas', centro_costo: 'CC-300', presupuesto: 30000.0 },
];

const proveedores = [
  { razon_social: 'Suministros Ofimáticos del Centro, C.A.', rif: 'J-30512874-6', email: 'ventas@sofcentro.com', telefono: '+58 212-555-0142' },
  { razon_social: 'Tecnología Integral Andina, S.A.', rif: 'J-40128955-1', email: 'comercial@tecandina.com', telefono: '+58 274-555-0198' },
  { razon_social: 'Ferretería Industrial Los Robles, C.A.', rif: 'J-29874310-3', email: 'pedidos@ferrerobles.com', telefono: '+58 241-555-0110' },
  { razon_social: 'Distribuidora de Limpieza Clarión, C.A.', rif: 'J-31766402-8', email: 'clientes@clarion.com', telefono: '+58 212-555-0177', activo: false },
];

const productos = [
  { codigo: 'PAP-001', nombre: 'Resma de papel bond carta 75 g', unidad: 'resma', precio_ref: 4.5 },
  { codigo: 'TEC-014', nombre: 'Monitor LED 24 pulgadas Full HD', unidad: 'unidad', precio_ref: 139.9 },
  { codigo: 'TEC-027', nombre: 'Teclado y ratón inalámbricos', unidad: 'kit', precio_ref: 28.75 },
  { codigo: 'FER-102', nombre: 'Cable eléctrico THHN 12 AWG', unidad: 'metro', precio_ref: 0.85 },
  { codigo: 'LIM-008', nombre: 'Desinfectante multiuso 3,8 L', unidad: 'galón', precio_ref: 6.2 },
];

async function sembrar() {
  try {
    await sequelize.authenticate();
    // Recrea las tablas para partir de datos limpios
    await sequelize.sync({ force: true });

    await Departamento.bulkCreate(departamentos, { validate: true });
    await Proveedor.bulkCreate(proveedores, { validate: true });
    await Producto.bulkCreate(productos, { validate: true });

    console.log(
      `Datos cargados: ${departamentos.length} departamentos, ${proveedores.length} proveedores, ${productos.length} productos`
    );
  } catch (error) {
    console.error('Error al cargar los datos de ejemplo:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

sembrar();
