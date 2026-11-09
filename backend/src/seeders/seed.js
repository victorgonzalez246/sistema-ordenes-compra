/**
 * Datos de ejemplo: Constructora Del Valle S.A. (caso del Quiz #2, Gestión de Inventarios).
 *
 * - Las órdenes de octubre son las del ejercicio A3 (incluye el duplicado OC-1041 / OC-1042).
 * - Los parámetros de los materiales son los del ejercicio A5.
 * - Todo el stock nace de movimientos (inventario inicial, recepciones de órdenes, salidas,
 *   traslados y un ajuste), y al final coincide con el stock actual de A5:
 *   cemento 190 sacos, varilla 850 unid., block 2 800 unid., arena 14 m³.
 *
 * Ejecutar: npm run seed (borra y recrea las tablas; conserva las cuentas de usuario)
 */
require('dotenv').config({ quiet: true });
const {
  sequelize,
  Departamento,
  Proveedor,
  Producto,
  OrdenCompra,
  DetalleOrden,
  Categoria,
  MetodoPago,
  Empleado,
  Bodega,
  ContactoProveedor,
  Cotizacion,
  Existencia,
  Requisicion,
  Recepcion,
  Factura,
  Pago,
  Usuario,
  Movimiento,
  AlertaReorden,
} = require('../models');
const bcrypt = require('bcryptjs');
const { BCRYPT_RONDAS } = require('../config/auth');
const { registrarMovimiento } = require('../services/inventario');
const { nivelPara } = require('../services/aprobacion');

// Cuenta de prueba para entrar al sistema en desarrollo (no usar en producción)
const USUARIO_DEMO = {
  nombre: 'Administrador de Compras',
  correo: 'admin@empresa.co.cr',
  password: 'Compras2026!',
};

// Una cuenta por nivel de la matriz de aprobación (misma contraseña que la cuenta de prueba).
// departamento: índice en el arreglo de departamentos
const USUARIOS_ROLES = [
  { nombre: 'Diego Alvarado (Jefatura de Mantenimiento)', correo: 'mantenimiento@empresa.co.cr', rol: 'jefatura_area', departamento: 1 },
  { nombre: 'Laura Montero (Jefatura de Compras)', correo: 'compras@empresa.co.cr', rol: 'jefatura_compras', departamento: 3 },
  { nombre: 'Daniela Chaves (Gerencia Financiera)', correo: 'finanzas@empresa.co.cr', rol: 'gerencia_financiera', departamento: 3 },
];
const CORREOS_DEMO = [USUARIO_DEMO.correo, ...USUARIOS_ROLES.map((u) => u.correo)];

// Las tres áreas que compran por su cuenta (según el caso) y Finanzas
const departamentos = [
  { nombre: 'Obras', centro_costo: 'CC-100', presupuesto: 250000000 },
  { nombre: 'Mantenimiento', centro_costo: 'CC-200', presupuesto: 40000000 },
  { nombre: 'Bodega Central', centro_costo: 'CC-300', presupuesto: 60000000 },
  { nombre: 'Administración y Finanzas', centro_costo: 'CC-400', presupuesto: 15000000 },
];

// Proveedores A a H del enunciado (nombres ficticios)
const proveedores = [
  { razon_social: 'Distribuidora de Cemento La Meseta S.A.', cedula_juridica: '3-101-410221', email: 'ventas@lameseta.co.cr', telefono: '+506 2290-1100' },
  { razon_social: 'Ferretería La Unión S.A.', cedula_juridica: '3-101-388190', email: 'pedidos@ferreunion.co.cr', telefono: '+506 2551-2040' },
  { razon_social: 'Aceros del Pacífico S.A.', cedula_juridica: '3-101-552301', email: 'comercial@acerospacifico.co.cr', telefono: '+506 2661-3300' },
  { razon_social: 'Ferretería El Tornillo S.R.L.', cedula_juridica: '3-102-774512', email: 'ventas@eltornillo.co.cr', telefono: '+506 2440-7788' },
  { razon_social: 'Suministros de Seguridad Industrial S.A.', cedula_juridica: '3-101-639004', email: 'ventas@sumiseguridad.co.cr', telefono: '+506 2232-4455' },
  { razon_social: 'Distribuidora Protección Total S.A.', cedula_juridica: '3-101-702115', email: 'info@protecciontotal.co.cr', telefono: '+506 2296-8800', activo: false },
  { razon_social: 'Bloques y Prefabricados Tico S.A.', cedula_juridica: '3-101-480377', email: 'ventas@bloquestico.co.cr', telefono: '+506 2475-1200' },
  { razon_social: 'Tajo y Agregados Río Claro S.R.L.', cedula_juridica: '3-102-655930', email: 'despachos@rioclaro.co.cr', telefono: '+506 2758-0900' },
];

// Taxonomía de dos niveles: categoría › subcategoría
const categorias = [
  { nombre: 'Materiales › Cemento y agregados', descripcion: 'Cemento, arena, piedra y concreto' },
  { nombre: 'Materiales › Acero de refuerzo', descripcion: 'Varilla corrugada, alambre y mallas' },
  { nombre: 'Materiales › Mampostería', descripcion: 'Block de concreto y ladrillo' },
  { nombre: 'Fontanería › Tubería y accesorios PVC', descripcion: 'Tubos, codos y uniones de PVC' },
  { nombre: 'Seguridad › Equipo de protección', descripcion: 'Guantes, cascos, chalecos y lentes' },
];

// Parámetros del ejercicio A5 (demanda en unidades por día, tiempo de entrega en días)
const productos = [
  { codigo: 'MAT-CEM-001', nombre: 'Cemento gris uso general 50 kg', unidad: 'saco', precio_ref: 6300, categoria: 0, demanda_promedio: 40, demanda_maxima: 55, tiempo_entrega: 3, stock_minimo: 45, stock_maximo: 400 },
  { codigo: 'MAT-ACE-003', nombre: 'Varilla corrugada #3 (3/8") grado 40, 6 m', unidad: 'unidad', precio_ref: 2050, categoria: 1, demanda_promedio: 120, demanda_maxima: 160, tiempo_entrega: 5, stock_minimo: 200, stock_maximo: 1500 },
  { codigo: 'MAT-MAM-012', nombre: 'Block de concreto 12 × 20 × 40 cm', unidad: 'unidad', precio_ref: 450, categoria: 2, demanda_promedio: 600, demanda_maxima: 900, tiempo_entrega: 4, stock_minimo: 1200, stock_maximo: 6000 },
  { codigo: 'MAT-AGR-010', nombre: 'Arena de tajo', unidad: 'm³', precio_ref: 18500, categoria: 0, demanda_promedio: 6, demanda_maxima: 10, tiempo_entrega: 2, stock_minimo: 8, stock_maximo: 40 },
  { codigo: 'SEG-GUA-NIT-L', nombre: 'Guantes de nitrilo talla L', unidad: 'par', precio_ref: 850, categoria: 4, demanda_promedio: 5, demanda_maxima: 8, tiempo_entrega: 3, stock_minimo: 9, stock_maximo: 120 },
  { codigo: 'FON-PVC-050', nombre: 'Tubo PVC 1/2" SDR 13.5, 6 m', unidad: 'unidad', precio_ref: 2900, categoria: 3, demanda_promedio: 3, demanda_maxima: 5, tiempo_entrega: 4, stock_minimo: 8, stock_maximo: 60 },
];

const metodosPago = [
  { nombre: 'Transferencia bancaria', descripcion: 'Transferencia a la cuenta IBAN del proveedor' },
  { nombre: 'SINPE Móvil', descripcion: 'Pagos menores a proveedores locales' },
  { nombre: 'Tarjeta corporativa', descripcion: 'Compras urgentes o en línea' },
  { nombre: 'Cheque', descripcion: 'En desuso desde 2025', activo: false },
];

// departamento: índice en el arreglo de departamentos
const empleados = [
  { cedula: '1-1234-0567', nombre: 'Mariana Castro Vega', puesto: 'Directora de obras', email: 'mcastro@delvalle.co.cr', telefono: '+506 8811-2233', departamento: 0 },
  { cedula: '2-0456-0789', nombre: 'Pablo Ramírez Soto', puesto: 'Maestro de obras · Los Robles', email: 'pramirez@delvalle.co.cr', telefono: '+506 8822-3344', departamento: 0 },
  { cedula: '1-0987-0654', nombre: 'Sofía Herrera Mora', puesto: 'Maestra de obras · Plaza Del Valle', email: 'sherrera@delvalle.co.cr', telefono: '+506 8833-4455', departamento: 0 },
  { cedula: '3-0321-0456', nombre: 'Diego Alvarado Rojas', puesto: 'Jefe de mantenimiento', email: 'dalvarado@delvalle.co.cr', telefono: '+506 8844-5566', departamento: 1 },
  { cedula: '4-0222-0333', nombre: 'Carlos Jiménez Ulate', puesto: 'Encargado de Bodega Central', email: 'cjimenez@delvalle.co.cr', telefono: '+506 8855-6677', departamento: 2 },
  { cedula: '1-1111-0222', nombre: 'Daniela Chaves Brenes', puesto: 'Analista financiera', email: 'dchaves@delvalle.co.cr', departamento: 3 },
  { cedula: '1-0555-0888', nombre: 'Jorge Araya Céspedes', puesto: 'Asistente de compras', email: 'jaraya@delvalle.co.cr', departamento: 3, activo: false },
];

// Bodega central, dos obras y el taller (cada una con su responsable)
const bodegas = [
  { nombre: 'Bodega Central', ubicacion: 'La Uruca, San José', responsable: 4 },
  { nombre: 'Obra Condominio Los Robles', ubicacion: 'San Rafael de Escazú', responsable: 1 },
  { nombre: 'Obra Plaza Del Valle', ubicacion: 'San Francisco de Heredia', responsable: 2 },
  { nombre: 'Taller de Mantenimiento', ubicacion: 'Pavas, San José', responsable: 3 },
];

const contactos = [
  { proveedor: 0, nombre: 'Karla Méndez Soto', puesto: 'Ejecutiva de cuenta', email: 'kmendez@lameseta.co.cr', telefono: '+506 8701-1122', principal: true },
  { proveedor: 1, nombre: 'Esteban Quirós Mata', puesto: 'Ventas', email: 'equiros@ferreunion.co.cr', principal: true },
  { proveedor: 2, nombre: 'Ricardo Soto Leiva', puesto: 'Gerente comercial', email: 'rsoto@acerospacifico.co.cr', telefono: '+506 8702-3344', principal: true },
  { proveedor: 6, nombre: 'Melissa Campos Ruiz', puesto: 'Despachos', email: 'mcampos@bloquestico.co.cr', principal: true },
  { proveedor: 7, nombre: 'Andrés Vindas Solano', puesto: 'Programación de viajes', email: 'avindas@rioclaro.co.cr', telefono: '+506 8703-5566', principal: true },
];

// Precio de contrato con el Proveedor A: cemento ₡6 300 y varilla #3 ₡2 050 (ejercicio A3)
const cotizaciones = [
  { proveedor: 0, producto: 0, fecha: '2026-09-15', vigencia_hasta: '2026-12-31', precio: 6300, dias_entrega: 3, observaciones: 'Precio de contrato anual' },
  { proveedor: 0, producto: 1, fecha: '2026-09-15', vigencia_hasta: '2026-12-31', precio: 2050, dias_entrega: 5, observaciones: 'Precio de contrato anual' },
  { proveedor: 1, producto: 0, fecha: '2026-10-01', vigencia_hasta: '2026-10-31', precio: 7100, dias_entrega: 1 },
  { proveedor: 2, producto: 1, fecha: '2026-10-01', vigencia_hasta: '2026-11-30', precio: 2150, dias_entrega: 4 },
  { proveedor: 3, producto: 1, fecha: '2026-10-10', vigencia_hasta: '2026-11-10', precio: 2600, dias_entrega: 1 },
  { proveedor: 6, producto: 2, fecha: '2026-10-05', vigencia_hasta: '2026-12-05', precio: 450, dias_entrega: 4 },
  { proveedor: 7, producto: 3, fecha: '2026-10-05', vigencia_hasta: '2026-12-05', precio: 18500, dias_entrega: 2 },
  { proveedor: 4, producto: 4, fecha: '2026-09-20', vigencia_hasta: '2026-12-20', precio: 850, dias_entrega: 3 },
  { proveedor: 1, producto: 5, fecha: '2026-10-01', vigencia_hasta: '2026-11-30', precio: 2900, dias_entrega: 4 },
];

const requisiciones = [
  { numero: 'REQ-2026-0101', fecha: '2026-10-01', empleado: 1, descripcion: 'Cemento para colado de losa, Condominio Los Robles', prioridad: 'alta', monto_estimado: 1300000, estado: 'aprobada' },
  { numero: 'REQ-2026-0102', fecha: '2026-10-07', empleado: 1, descripcion: 'Varilla #3 para columnas de la torre B', prioridad: 'alta', monto_estimado: 1100000, estado: 'aprobada' },
  { numero: 'REQ-2026-0103', fecha: '2026-10-18', empleado: 2, descripcion: 'Block para paredes del nivel 2, Plaza Del Valle', prioridad: 'media', monto_estimado: 1400000, estado: 'aprobada' },
  { numero: 'REQ-2026-0104', fecha: '2026-10-20', empleado: 3, descripcion: 'Herramienta eléctrica para el taller', prioridad: 'baja', monto_estimado: 350000, estado: 'rechazada' },
  { numero: 'REQ-2026-0105', fecha: '2026-11-03', empleado: 4, descripcion: 'Reposición de cemento en Bodega Central', prioridad: 'media', monto_estimado: 1260000, estado: 'pendiente' },
];

// Órdenes del ejercicio A3 y otras del mes. Se crean aprobadas: al recibirlas completas pasan solas a "recibida".
const ordenes = [
  { numero: 'OC-1041', fecha: '2026-10-02', estado: 'aprobada', departamento: 0, proveedor: 0, lineas: [{ producto: 0, cantidad: 200, precio: 6450 }] },
  { numero: 'OC-1042', fecha: '2026-10-02', estado: 'aprobada', departamento: 0, proveedor: 0, lineas: [{ producto: 0, cantidad: 200, precio: 6450 }] },
  { numero: 'OC-1044', fecha: '2026-10-03', estado: 'aprobada', departamento: 2, proveedor: 4, lineas: [{ producto: 4, cantidad: 100, precio: 850 }] },
  { numero: 'OC-1047', fecha: '2026-10-06', estado: 'aprobada', departamento: 1, proveedor: 1, lineas: [{ producto: 0, cantidad: 40, precio: 7100 }] },
  { numero: 'OC-1048', fecha: '2026-10-07', estado: 'aprobada', departamento: 1, proveedor: 1, lineas: [{ producto: 5, cantidad: 25, precio: 2900 }] },
  { numero: 'OC-1050', fecha: '2026-10-08', estado: 'aprobada', departamento: 0, proveedor: 2, lineas: [{ producto: 1, cantidad: 500, precio: 2150 }] },
  { numero: 'OC-1053', fecha: '2026-10-09', estado: 'aprobada', departamento: 0, proveedor: 2, lineas: [{ producto: 1, cantidad: 480, precio: 2150 }] },
  { numero: 'OC-1058', fecha: '2026-10-13', estado: 'aprobada', departamento: 1, proveedor: 3, lineas: [{ producto: 1, cantidad: 60, precio: 2600 }] },
  { numero: 'OC-1061', fecha: '2026-10-15', estado: 'aprobada', departamento: 2, proveedor: 0, lineas: [{ producto: 0, cantidad: 300, precio: 6300 }] },
  { numero: 'OC-1064', fecha: '2026-10-20', estado: 'aprobada', departamento: 0, proveedor: 6, lineas: [{ producto: 2, cantidad: 3000, precio: 450 }] },
  { numero: 'OC-1066', fecha: '2026-10-22', estado: 'aprobada', departamento: 0, proveedor: 7, lineas: [{ producto: 3, cantidad: 30, precio: 18500 }] },
  // Pendientes de aprobación (demo de la matriz):
  // OC-1070 suma con OC-1061 (mismo departamento y proveedor) y sube a Gerencia Financiera
  { numero: 'OC-1070', fecha: '2026-11-04', estado: 'pendiente', departamento: 2, proveedor: 0, lineas: [{ producto: 0, cantidad: 200, precio: 6300 }] },
  // OC-1072 es pequeña: la aprueba la Jefatura de Mantenimiento
  { numero: 'OC-1072', fecha: '2026-11-06', estado: 'pendiente', departamento: 1, proveedor: 1, lineas: [{ producto: 5, cantidad: 20, precio: 2900 }] },
];

/**
 * Historia del inventario en orden cronológico. Índices: producto, bodega, orden, empleado.
 *   inicial:   inventario inicial en una bodega
 *   recepcion: llega una orden (genera la entrada ligada a la orden)
 *   salida / traslado / ajuste: movimientos con su documento
 */
const historia = [
  { tipo: 'inicial', fecha: '2026-10-01', bodega: 0, lineas: [{ producto: 0, cantidad: 100 }, { producto: 1, cantidad: 200 }, { producto: 2, cantidad: 1000 }] },
  { tipo: 'recepcion', fecha: '2026-10-03', orden: 0, bodega: 1, empleado: 1, observaciones: 'Entrega completa en obra' },
  { tipo: 'recepcion', fecha: '2026-10-04', orden: 2, bodega: 0, empleado: 4 },
  { tipo: 'recepcion', fecha: '2026-10-07', orden: 3, bodega: 3, empleado: 3 },
  { tipo: 'recepcion', fecha: '2026-10-08', orden: 4, bodega: 3, empleado: 3 },
  { tipo: 'recepcion', fecha: '2026-10-09', orden: 5, bodega: 1, empleado: 1 },
  { tipo: 'recepcion', fecha: '2026-10-10', orden: 6, bodega: 2, empleado: 2 },
  { tipo: 'salida', fecha: '2026-10-10', producto: 0, origen: 1, cantidad: 150, documento: 'VS-0101', observaciones: 'Colado de losa, nivel 1' },
  { tipo: 'salida', fecha: '2026-10-12', producto: 4, origen: 0, cantidad: 40, documento: 'VS-0102', observaciones: 'Entrega a cuadrilla de acabados' },
  { tipo: 'recepcion', fecha: '2026-10-14', orden: 7, bodega: 3, empleado: 3 },
  { tipo: 'traslado', fecha: '2026-10-14', producto: 4, origen: 0, destino: 1, cantidad: 30, documento: 'BT-0031' },
  { tipo: 'salida', fecha: '2026-10-15', producto: 0, origen: 3, cantidad: 30, documento: 'VS-0103', observaciones: 'Reparación de aceras' },
  { tipo: 'salida', fecha: '2026-10-15', producto: 1, origen: 1, cantidad: 250, documento: 'VS-0104', observaciones: 'Columnas torre B' },
  { tipo: 'recepcion', fecha: '2026-10-16', orden: 8, bodega: 0, empleado: 4 },
  { tipo: 'traslado', fecha: '2026-10-18', producto: 0, origen: 0, destino: 2, cantidad: 150, documento: 'BT-0032' },
  { tipo: 'salida', fecha: '2026-10-20', producto: 0, origen: 1, cantidad: 50, documento: 'VS-0105' },
  { tipo: 'salida', fecha: '2026-10-20', producto: 4, origen: 1, cantidad: 25, documento: 'VS-0106' },
  { tipo: 'salida', fecha: '2026-10-20', producto: 5, origen: 3, cantidad: 12, documento: 'VS-0107', observaciones: 'Cambio de tubería en baños de oficina' },
  { tipo: 'recepcion', fecha: '2026-10-21', orden: 9, bodega: 0, empleado: 4 },
  { tipo: 'salida', fecha: '2026-10-22', producto: 1, origen: 2, cantidad: 100, documento: 'VS-0108' },
  { tipo: 'recepcion', fecha: '2026-10-23', orden: 10, bodega: 1, empleado: 1 },
  { tipo: 'traslado', fecha: '2026-10-23', producto: 2, origen: 0, destino: 1, cantidad: 1500, documento: 'BT-0033' },
  { tipo: 'salida', fecha: '2026-10-25', producto: 0, origen: 2, cantidad: 120, documento: 'VS-0109' },
  { tipo: 'salida', fecha: '2026-10-25', producto: 1, origen: 3, cantidad: 40, documento: 'VS-0110' },
  { tipo: 'salida', fecha: '2026-10-28', producto: 2, origen: 1, cantidad: 1200, documento: 'VS-0111', observaciones: 'Paredes nivel 2' },
  { tipo: 'salida', fecha: '2026-10-30', producto: 0, origen: 0, cantidad: 100, documento: 'VS-0112' },
  { tipo: 'salida', fecha: '2026-11-02', producto: 3, origen: 1, cantidad: 16, documento: 'VS-0113' },
  { tipo: 'ajuste', fecha: '2026-11-03', producto: 4, origen: 1, cantidad: 1, documento: 'AJ-0001', observaciones: 'Conteo físico: falta 1 par' },
];

// Mínimo por bodega (el de la empresa está en el producto)
const minimosPorBodega = [
  { producto: 0, bodega: 0, minimo: 100 },
  { producto: 0, bodega: 1, minimo: 20 },
  { producto: 2, bodega: 0, minimo: 1000 },
  { producto: 3, bodega: 1, minimo: 5 },
];

const facturas = [
  { numero: 'FAC-A-20511', orden: 0, fecha: '2026-10-03', fecha_vencimiento: '2026-11-02', monto: 1290000 },
  { numero: 'FAC-C-88102', orden: 5, fecha: '2026-10-09', fecha_vencimiento: '2026-11-08', monto: 1075000 },
  { numero: 'FAC-A-20644', orden: 8, fecha: '2026-10-16', fecha_vencimiento: '2026-11-15', monto: 1890000 },
  { numero: 'FAC-G-3310', orden: 9, fecha: '2026-10-21', fecha_vencimiento: '2026-11-20', monto: 1350000 },
];

const pagos = [
  { factura: 0, metodo: 0, fecha: '2026-10-20', monto: 1290000, referencia: 'TRF-558120' },
  { factura: 1, metodo: 0, fecha: '2026-11-02', monto: 500000, referencia: 'TRF-561877' },
];

async function sembrar() {
  try {
    await sequelize.authenticate();

    // Las cuentas creadas por los usuarios se conservan: se respaldan antes de recrear las tablas
    let cuentas = [];
    try {
      cuentas = await Usuario.scope('conPassword').findAll({ raw: true });
    } catch {
      // La tabla todavía no existe (primera vez que se ejecuta el seed)
    }

    // Recrea las tablas para partir de datos limpios
    await sequelize.sync({ force: true });

    // No se conservan la cuenta de prueba (se vuelve a crear) ni las que genera la colección de Postman
    const conservadas = cuentas.filter(
      (c) => !CORREOS_DEMO.includes(c.correo) && !/^prueba\.\d+@empresa\.co\.cr$/.test(c.correo)
    );
    if (conservadas.length) {
      await Usuario.bulkCreate(
        conservadas.map(({ nombre, correo, password, rol, fecha_creacion }) => ({ nombre, correo, password, rol: rol ?? 'solicitante', fecha_creacion }))
      );
    }
    const deps = await Departamento.bulkCreate(departamentos, { validate: true });

    const hash = await bcrypt.hash(USUARIO_DEMO.password, BCRYPT_RONDAS);
    const demo = await Usuario.create({
      nombre: USUARIO_DEMO.nombre,
      correo: USUARIO_DEMO.correo,
      password: hash,
      rol: 'gerencia_general',
    });
    await Usuario.bulkCreate(
      USUARIOS_ROLES.map(({ departamento, ...u }) => ({ ...u, password: hash, departamento_id: deps[departamento].id }))
    );
    const provs = await Proveedor.bulkCreate(proveedores, { validate: true });
    const cats = await Categoria.bulkCreate(categorias, { validate: true });
    const prods = await Producto.bulkCreate(
      productos.map(({ categoria, ...p }) => ({ ...p, categoria_id: cats[categoria].id })),
      { validate: true }
    );

    const ords = [];
    for (const o of ordenes) {
      const detalles = o.lineas.map((l) => ({
        producto_id: prods[l.producto].id,
        cantidad: l.cantidad,
        precio_unitario: l.precio,
        subtotal: Math.round(l.cantidad * l.precio * 100) / 100,
      }));
      const total = Math.round(detalles.reduce((s, d) => s + d.subtotal, 0) * 100) / 100;
      ords.push(
        await OrdenCompra.create(
          {
            numero: o.numero,
            fecha: o.fecha,
            estado: o.estado,
            total,
            // Las órdenes históricas quedan aprobadas por la Gerencia General
            ...(o.estado !== 'pendiente' && {
              aprobada_por_id: demo.id,
              aprobada_en: new Date(`${o.fecha}T15:00:00Z`),
              monto_evaluado: total,
              nivel_aprobacion: nivelPara(total).rol,
            }),
            departamento_id: deps[o.departamento].id,
            proveedor_id: provs[o.proveedor].id,
            detalles,
          },
          { include: [{ model: DetalleOrden, as: 'detalles' }] }
        )
      );
    }

    const metodos = await MetodoPago.bulkCreate(metodosPago, { validate: true });
    const emps = await Empleado.bulkCreate(
      empleados.map(({ departamento, ...e }) => ({ ...e, departamento_id: deps[departamento].id })),
      { validate: true }
    );
    const bods = await Bodega.bulkCreate(
      bodegas.map(({ responsable, ...b }) => ({ ...b, responsable_id: emps[responsable].id })),
      { validate: true }
    );
    await ContactoProveedor.bulkCreate(
      contactos.map(({ proveedor, ...c }) => ({ ...c, proveedor_id: provs[proveedor].id })),
      { validate: true }
    );
    await Cotizacion.bulkCreate(
      cotizaciones.map(({ proveedor, producto, ...c }) => ({
        ...c,
        proveedor_id: provs[proveedor].id,
        producto_id: prods[producto].id,
      })),
      { validate: true }
    );
    await Requisicion.bulkCreate(
      requisiciones.map(({ empleado, ...r }) => ({ ...r, empleado_id: emps[empleado].id })),
      { validate: true }
    );

    // El inventario se arma con movimientos, igual que en la API (mismas reglas y alertas)
    const opciones = (transaction) => ({ usuario_id: demo.id, transaction });
    for (const e of historia) {
      await sequelize.transaction(async (t) => {
        if (e.tipo === 'inicial') {
          for (const l of e.lineas) {
            await registrarMovimiento(
              { tipo: 'entrada', fecha: e.fecha, producto_id: prods[l.producto].id, cantidad: l.cantidad, bodega_destino_id: bods[e.bodega].id, documento_tipo: 'inventario_inicial', documento_numero: 'INV-2026-001', observaciones: 'Conteo inicial de octubre' },
              opciones(t)
            );
          }
        } else if (e.tipo === 'recepcion') {
          const orden = ords[e.orden];
          const recepcion = await Recepcion.create(
            { orden_id: orden.id, bodega_id: bods[e.bodega].id, empleado_id: emps[e.empleado].id, fecha: e.fecha, observaciones: e.observaciones ?? 'Entrega completa' },
            { transaction: t }
          );
          for (const d of orden.detalles) {
            await registrarMovimiento(
              { tipo: 'entrada', fecha: e.fecha, producto_id: d.producto_id, cantidad: d.cantidad, bodega_destino_id: recepcion.bodega_id, orden_id: orden.id, recepcion_id: recepcion.id },
              opciones(t)
            );
          }
        } else {
          await registrarMovimiento(
            {
              tipo: e.tipo,
              fecha: e.fecha,
              producto_id: prods[e.producto].id,
              cantidad: e.cantidad,
              bodega_origen_id: e.origen !== undefined ? bods[e.origen].id : null,
              bodega_destino_id: e.destino !== undefined ? bods[e.destino].id : null,
              documento_numero: e.documento,
              observaciones: e.observaciones ?? null,
            },
            opciones(t)
          );
        }
      });
    }

    for (const m of minimosPorBodega) {
      const [existencia] = await Existencia.findOrCreate({
        where: { producto_id: prods[m.producto].id, bodega_id: bods[m.bodega].id },
        defaults: { cantidad: 0 },
      });
      await existencia.update({ minimo: m.minimo });
    }

    // Lo pagado y el estado de cada factura salen de sus pagos
    const facts = await Factura.bulkCreate(
      facturas.map(({ orden, ...f }, i) => {
        const pagado = pagos.filter((p) => p.factura === i).reduce((s, p) => s + p.monto, 0);
        return { ...f, orden_id: ords[orden].id, pagado, estado: pagado >= f.monto ? 'pagada' : 'pendiente' };
      }),
      { validate: true }
    );
    await Pago.bulkCreate(
      pagos.map(({ factura, metodo, ...p }) => ({
        ...p,
        factura_id: facts[factura].id,
        metodo_pago_id: metodos[metodo].id,
      })),
      { validate: true }
    );

    const [movimientos, alertas] = await Promise.all([
      Movimiento.count(),
      AlertaReorden.count({ where: { estado: 'abierta' } }),
    ]);
    console.log(
      `Datos cargados: Constructora Del Valle S.A. con ${productos.length} materiales, ${bodegas.length} bodegas/obras, ` +
        `${ordenes.length} órdenes de compra y ${movimientos} movimientos de inventario`
    );
    console.log(`Alertas de reorden abiertas: ${alertas}`);
    console.log(`Usuario de prueba: ${USUARIO_DEMO.correo} (Gerencia General; contraseña en src/seeders/seed.js)`);
    console.log(`Cuentas por rol: ${USUARIOS_ROLES.map((u) => u.correo).join(', ')} (misma contraseña)`);
    if (conservadas.length) console.log(`Se conservaron ${conservadas.length} cuenta(s) existente(s)`);
  } catch (error) {
    console.error('Error al cargar los datos de ejemplo:', error.message, error.errors ?? error.detalles ?? '');
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

sembrar();
