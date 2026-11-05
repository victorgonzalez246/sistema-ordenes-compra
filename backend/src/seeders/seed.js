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
} = require('../models');
const bcrypt = require('bcryptjs');
const { BCRYPT_RONDAS } = require('../config/auth');

// Cuenta de prueba para entrar al sistema en desarrollo (no usar en producción)
const USUARIO_DEMO = {
  nombre: 'Administrador de Compras',
  correo: 'admin@empresa.co.cr',
  password: 'Compras2026!',
};

const categorias = [
  { nombre: 'Papelería y oficina', descripcion: 'Papel, artículos de escritorio y consumibles' },
  { nombre: 'Tecnología', descripcion: 'Equipo de cómputo, periféricos y accesorios' },
  { nombre: 'Ferretería y electricidad', descripcion: 'Materiales para mantenimiento y obras menores' },
  { nombre: 'Limpieza', descripcion: 'Productos de limpieza y desinfección' },
];

const metodosPago = [
  { nombre: 'Transferencia bancaria', descripcion: 'Transferencia a la cuenta IBAN del proveedor' },
  { nombre: 'SINPE Móvil', descripcion: 'Pagos menores a proveedores locales' },
  { nombre: 'Tarjeta corporativa', descripcion: 'Compras urgentes o en línea' },
  { nombre: 'Cheque', descripcion: 'En desuso desde 2025', activo: false },
];

// departamento: índice en el arreglo de departamentos
const empleados = [
  { cedula: '1-1234-0567', nombre: 'Andrea Solís Mora', puesto: 'Coordinadora de TI', email: 'asolis@empresa.co.cr', telefono: '+506 8811-2233', departamento: 0 },
  { cedula: '2-0456-0789', nombre: 'Luis Fernando Vargas', puesto: 'Técnico de soporte', email: 'lvargas@empresa.co.cr', telefono: '+506 8822-3344', departamento: 0 },
  { cedula: '1-0987-0654', nombre: 'María José Rojas', puesto: 'Jefa de mantenimiento', email: 'mrojas@empresa.co.cr', telefono: '+506 8833-4455', departamento: 1 },
  { cedula: '3-0321-0456', nombre: 'Carlos Jiménez Ulate', puesto: 'Encargado de bodega', email: 'cjimenez@empresa.co.cr', telefono: '+506 8844-5566', departamento: 1 },
  { cedula: '4-0222-0333', nombre: 'Daniela Chaves Brenes', puesto: 'Analista financiera', email: 'dchaves@empresa.co.cr', telefono: '+506 8855-6677', departamento: 2 },
  { cedula: '1-1111-0222', nombre: 'Jorge Araya Céspedes', puesto: 'Asistente administrativo', email: 'jaraya@empresa.co.cr', departamento: 2, activo: false },
];

const bodegas = [
  { nombre: 'Bodega Central', ubicacion: 'Pavas, San José · Edificio B', responsable: 3 },
  { nombre: 'Bodega de TI', ubicacion: 'Oficinas centrales · Piso 2', responsable: 1 },
  { nombre: 'Bodega de Mantenimiento', ubicacion: 'Barreal, Heredia', responsable: 2 },
];

const contactos = [
  { proveedor: 0, nombre: 'Karla Méndez Soto', puesto: 'Ejecutiva de ventas', email: 'kmendez@sofvalle.co.cr', telefono: '+506 8701-1122', principal: true },
  { proveedor: 0, nombre: 'Óscar Pérez Alfaro', puesto: 'Cobros', email: 'cobros@sofvalle.co.cr', telefono: '+506 2222-0145' },
  { proveedor: 1, nombre: 'Ricardo Soto Leiva', puesto: 'Gerente comercial', email: 'rsoto@tecintegral.co.cr', telefono: '+506 8702-3344', principal: true },
  { proveedor: 1, nombre: 'Fabiola Núñez Arce', puesto: 'Soporte técnico', email: 'soporte@tecintegral.co.cr' },
  { proveedor: 2, nombre: 'Esteban Quirós Mata', puesto: 'Ventas corporativas', email: 'equiros@ferrerobles.co.cr', telefono: '+506 8703-5566', principal: true },
  { proveedor: 3, nombre: 'Melissa Campos Ruiz', puesto: 'Atención al cliente', email: 'mcampos@clarion.co.cr', principal: true },
];

const cotizaciones = [
  { proveedor: 0, producto: 0, fecha: '2026-10-01', vigencia_hasta: '2026-12-31', precio: 2950, dias_entrega: 2 },
  { proveedor: 1, producto: 1, fecha: '2026-10-15', vigencia_hasta: '2026-11-15', precio: 70000, dias_entrega: 5, observaciones: 'Precio especial por 4 unidades o más' },
  { proveedor: 1, producto: 2, fecha: '2026-10-15', vigencia_hasta: '2026-11-15', precio: 14900, dias_entrega: 5 },
  { proveedor: 0, producto: 2, fecha: '2026-10-16', vigencia_hasta: '2026-11-30', precio: 15500, dias_entrega: 3 },
  { proveedor: 2, producto: 3, fecha: '2026-10-28', vigencia_hasta: '2026-11-28', precio: 450, dias_entrega: 3 },
];

const existencias = [
  { producto: 0, bodega: 0, cantidad: 35, minimo: 20 },
  { producto: 4, bodega: 0, cantidad: 12, minimo: 10 },
  { producto: 1, bodega: 1, cantidad: 2, minimo: 2 },
  { producto: 2, bodega: 1, cantidad: 3, minimo: 5 },
  { producto: 3, bodega: 2, cantidad: 80, minimo: 100 },
];

const requisiciones = [
  { numero: 'REQ-2026-0001', fecha: '2026-10-02', empleado: 4, descripcion: 'Papel para impresión de reportes mensuales', prioridad: 'media', monto_estimado: 59000, estado: 'aprobada' },
  { numero: 'REQ-2026-0002', fecha: '2026-10-18', empleado: 0, descripcion: 'Monitores y teclados para los nuevos puestos de soporte', prioridad: 'alta', monto_estimado: 340000, estado: 'aprobada' },
  { numero: 'REQ-2026-0003', fecha: '2026-10-25', empleado: 3, descripcion: 'Estantería metálica para la Bodega Central', prioridad: 'media', monto_estimado: 450000, estado: 'rechazada' },
  { numero: 'REQ-2026-0004', fecha: '2026-11-01', empleado: 2, descripcion: 'Cable eléctrico para la remodelación de oficinas', prioridad: 'media', monto_estimado: 67500, estado: 'aprobada' },
  { numero: 'REQ-2026-0005', fecha: '2026-11-04', empleado: 1, descripcion: 'Licencias de antivirus para 20 equipos', prioridad: 'baja', monto_estimado: 120000, estado: 'pendiente' },
];

// orden: índice en el arreglo de órdenes
const recepciones = [
  { orden: 0, bodega: 0, empleado: 3, fecha: '2026-10-09', observaciones: 'Entrega completa' },
  { orden: 1, bodega: 1, empleado: 1, fecha: '2026-10-28', observaciones: 'Entrega parcial: llegaron 2 de 4 monitores' },
];

const facturas = [
  { numero: 'FAC-SOV-1045', orden: 0, fecha: '2026-10-09', fecha_vencimiento: '2026-11-08', monto: 59000 },
  { numero: 'FAC-TIT-8821', orden: 1, fecha: '2026-10-29', fecha_vencimiento: '2026-11-28', monto: 339600 },
];

const pagos = [
  { factura: 0, metodo: 0, fecha: '2026-10-20', monto: 59000, referencia: 'TRF-558120' },
  { factura: 1, metodo: 0, fecha: '2026-11-02', monto: 150000, referencia: 'TRF-561877' },
];

const departamentos = [
  { nombre: 'Tecnología de la Información', centro_costo: 'CC-100', presupuesto: 45000000 },
  { nombre: 'Mantenimiento y Servicios Generales', centro_costo: 'CC-200', presupuesto: 22000000 },
  { nombre: 'Administración y Finanzas', centro_costo: 'CC-300', presupuesto: 15000000 },
];

const proveedores = [
  { razon_social: 'Suministros Ofimáticos del Valle S.A.', cedula_juridica: '3-101-512874', email: 'ventas@sofvalle.co.cr', telefono: '+506 2222-0142' },
  { razon_social: 'Tecnología Integral Tica S.A.', cedula_juridica: '3-101-128955', email: 'comercial@tecintegral.co.cr', telefono: '+506 2290-0198' },
  { razon_social: 'Ferretería Industrial Los Robles S.R.L.', cedula_juridica: '3-102-874310', email: 'pedidos@ferrerobles.co.cr', telefono: '+506 2440-0110' },
  { razon_social: 'Distribuidora de Limpieza Clarión S.A.', cedula_juridica: '3-101-766402', email: 'clientes@clarion.co.cr', telefono: '+506 2551-0177', activo: false },
];

const productos = [
  { codigo: 'PAP-001', nombre: 'Resma de papel bond carta 75 g', unidad: 'resma', precio_ref: 2950, categoria: 0 },
  { codigo: 'TEC-014', nombre: 'Monitor LED 24 pulgadas Full HD', unidad: 'unidad', precio_ref: 72500, categoria: 1 },
  { codigo: 'TEC-027', nombre: 'Teclado y ratón inalámbricos', unidad: 'kit', precio_ref: 14900, categoria: 1 },
  { codigo: 'FER-102', nombre: 'Cable eléctrico THHN 12 AWG', unidad: 'metro', precio_ref: 450, categoria: 2 },
  { codigo: 'LIM-008', nombre: 'Desinfectante multiuso 3,8 L', unidad: 'galón', precio_ref: 3200, categoria: 3 },
];

// Órdenes de ejemplo; los índices apuntan a los arreglos de arriba
const ordenes = [
  {
    numero: 'OC-2026-0001', fecha: '2026-10-06', estado: 'recibida', departamento: 2, proveedor: 0,
    lineas: [{ producto: 0, cantidad: 20, precio: 2950 }],
  },
  {
    numero: 'OC-2026-0002', fecha: '2026-10-21', estado: 'aprobada', departamento: 0, proveedor: 1,
    lineas: [
      { producto: 1, cantidad: 4, precio: 70000 },
      { producto: 2, cantidad: 4, precio: 14900 },
    ],
  },
  {
    numero: 'OC-2026-0003', fecha: '2026-11-03', estado: 'pendiente', departamento: 1, proveedor: 2,
    lineas: [{ producto: 3, cantidad: 150, precio: 450 }],
  },
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
      (c) => c.correo !== USUARIO_DEMO.correo && !/^prueba\.\d+@empresa\.co\.cr$/.test(c.correo)
    );
    if (conservadas.length) {
      await Usuario.bulkCreate(
        conservadas.map(({ nombre, correo, password, fecha_creacion }) => ({ nombre, correo, password, fecha_creacion }))
      );
    }

    const deps = await Departamento.bulkCreate(departamentos, { validate: true });
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
      const orden = await OrdenCompra.create(
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
      ords.push(orden);
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
    await Existencia.bulkCreate(
      existencias.map(({ producto, bodega, ...e }) => ({
        ...e,
        producto_id: prods[producto].id,
        bodega_id: bods[bodega].id,
      })),
      { validate: true }
    );
    await Requisicion.bulkCreate(
      requisiciones.map(({ empleado, ...r }) => ({ ...r, empleado_id: emps[empleado].id })),
      { validate: true }
    );
    await Recepcion.bulkCreate(
      recepciones.map(({ orden, bodega, empleado, ...r }) => ({
        ...r,
        orden_id: ords[orden].id,
        bodega_id: bods[bodega].id,
        empleado_id: emps[empleado].id,
      })),
      { validate: true }
    );

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

    await Usuario.create({
      nombre: USUARIO_DEMO.nombre,
      correo: USUARIO_DEMO.correo,
      password: await bcrypt.hash(USUARIO_DEMO.password, BCRYPT_RONDAS),
    });

    console.log(
      `Datos cargados: ${departamentos.length} departamentos, ${proveedores.length} proveedores, ` +
        `${productos.length} productos, ${ordenes.length} órdenes de compra y datos de las 11 tablas restantes`
    );
    console.log(`Usuario de prueba: ${USUARIO_DEMO.correo} (contraseña en src/seeders/seed.js)`);
    if (conservadas.length) console.log(`Se conservaron ${conservadas.length} cuenta(s) existente(s)`);
  } catch (error) {
    console.error('Error al cargar los datos de ejemplo:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

sembrar();
