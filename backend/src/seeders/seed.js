require('dotenv').config({ quiet: true });
const { sequelize, Departamento, Proveedor, Producto, OrdenCompra, DetalleOrden } = require('../models');

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

// Órdenes de ejemplo; los índices apuntan a los arreglos de arriba
const ordenes = [
  {
    numero: 'OC-2026-0001', fecha: '2026-10-06', estado: 'recibida', departamento: 2, proveedor: 0,
    lineas: [{ producto: 0, cantidad: 20, precio: 4.5 }],
  },
  {
    numero: 'OC-2026-0002', fecha: '2026-10-21', estado: 'aprobada', departamento: 0, proveedor: 1,
    lineas: [
      { producto: 1, cantidad: 4, precio: 135.0 },
      { producto: 2, cantidad: 4, precio: 28.75 },
    ],
  },
  {
    numero: 'OC-2026-0003', fecha: '2026-11-03', estado: 'pendiente', departamento: 1, proveedor: 2,
    lineas: [{ producto: 3, cantidad: 150, precio: 0.85 }],
  },
];

async function sembrar() {
  try {
    await sequelize.authenticate();
    // Recrea las tablas para partir de datos limpios
    await sequelize.sync({ force: true });

    const deps = await Departamento.bulkCreate(departamentos, { validate: true });
    const provs = await Proveedor.bulkCreate(proveedores, { validate: true });
    const prods = await Producto.bulkCreate(productos, { validate: true });

    for (const o of ordenes) {
      const detalles = o.lineas.map((l) => ({
        producto_id: prods[l.producto].id,
        cantidad: l.cantidad,
        precio_unitario: l.precio,
        subtotal: Math.round(l.cantidad * l.precio * 100) / 100,
      }));
      const total = Math.round(detalles.reduce((s, d) => s + d.subtotal, 0) * 100) / 100;
      await OrdenCompra.create(
        {
          numero: o.numero,
          fecha: o.fecha,
          estado: o.estado,
          total,
          departamento_id: deps[o.departamento].id,
          proveedor_id: provs[o.proveedor].id,
          detalles,
        },
        { include: [{ model: DetalleOrden, as: 'detalles' }] }
      );
    }

    console.log(
      `Datos cargados: ${departamentos.length} departamentos, ${proveedores.length} proveedores, ` +
        `${productos.length} productos y ${ordenes.length} órdenes de compra`
    );
  } catch (error) {
    console.error('Error al cargar los datos de ejemplo:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

sembrar();
