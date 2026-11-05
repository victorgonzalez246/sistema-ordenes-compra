import { diasHasta, dinero, dineroCorto, entero, hoyISO, sumar } from '../utils/formato';

// Indicadores de cada pantalla de catálogo: (registros) => [{ titulo, valor, detalle, estado }]
const contar = (lista, condicion) => lista.filter(condicion).length;
const distintos = (lista, campo) => new Set(lista.map((x) => x[campo]).filter((v) => v != null)).size;
const mesActual = () => hoyISO().slice(0, 7);
const promedio = (lista, campo) => (lista.length ? sumar(lista, campo) / lista.length : 0);

const activos = (titulo, campo = 'activo') => (lista) => {
  const inactivos = contar(lista, (x) => !x[campo]);
  return [
    { titulo, valor: entero(lista.length), detalle: 'registrados' },
    { titulo: 'Activos', valor: entero(lista.length - inactivos), detalle: 'disponibles para usar' },
    { titulo: 'Inactivos', valor: entero(inactivos), detalle: 'se conservan por su historial' },
  ];
};

export const metricas = {
  departamentos: (lista) => [
    { titulo: 'Departamentos', valor: entero(lista.length), detalle: 'centros de costo' },
    { titulo: 'Presupuesto total', valor: dineroCorto(sumar(lista, 'presupuesto')), detalle: dinero(sumar(lista, 'presupuesto')) },
    { titulo: 'Presupuesto promedio', valor: dineroCorto(promedio(lista, 'presupuesto')), detalle: 'por departamento' },
  ],

  empleados: (lista) => [
    { titulo: 'Empleados', valor: entero(lista.length), detalle: `en ${distintos(lista, 'departamento_id')} departamento(s)` },
    { titulo: 'Activos', valor: entero(contar(lista, (e) => e.activo)), detalle: 'pueden solicitar y recibir' },
    { titulo: 'Inactivos', valor: entero(contar(lista, (e) => !e.activo)), detalle: 'se conservan por su historial' },
  ],

  proveedores: activos('Proveedores'),

  contactos: (lista) => [
    { titulo: 'Contactos', valor: entero(lista.length), detalle: `de ${distintos(lista, 'proveedor_id')} proveedor(es)` },
    { titulo: 'Contactos principales', valor: entero(contar(lista, (c) => c.principal)), detalle: 'uno por proveedor' },
    { titulo: 'Con teléfono', valor: entero(contar(lista, (c) => c.telefono)), detalle: `de ${entero(lista.length)}` },
  ],

  categorias: (lista) => [
    { titulo: 'Categorías', valor: entero(lista.length), detalle: 'agrupan el catálogo' },
    { titulo: 'Con descripción', valor: entero(contar(lista, (c) => c.descripcion)), detalle: `de ${entero(lista.length)}` },
  ],

  productos: (lista) => {
    const sinCategoria = contar(lista, (p) => !p.categoria_id);
    return [
      { titulo: 'Productos', valor: entero(lista.length), detalle: `en ${distintos(lista, 'categoria_id')} categoría(s)` },
      { titulo: 'Precio de referencia promedio', valor: dineroCorto(promedio(lista, 'precio_ref')), detalle: 'por unidad' },
      {
        titulo: 'Sin categoría',
        valor: entero(sinCategoria),
        estado: sinCategoria ? { tono: 'aviso', texto: 'Asígnales una categoría' } : { tono: 'bien', texto: 'Todos clasificados' },
      },
    ];
  },

  requisiciones: (lista) => {
    const pendientes = lista.filter((r) => r.estado === 'pendiente');
    const aprobadas = lista.filter((r) => r.estado === 'aprobada');
    return [
      { titulo: 'Pendientes', valor: entero(pendientes.length), detalle: `${dineroCorto(sumar(pendientes, 'monto_estimado'))} estimados` },
      { titulo: 'Aprobadas', valor: entero(aprobadas.length), detalle: `${dineroCorto(sumar(aprobadas, 'monto_estimado'))} estimados` },
      { titulo: 'Rechazadas', valor: entero(contar(lista, (r) => r.estado === 'rechazada')), detalle: `de ${entero(lista.length)} solicitudes` },
      {
        titulo: 'Prioridad alta',
        valor: entero(contar(pendientes, (r) => r.prioridad === 'alta')),
        detalle: 'entre las pendientes',
      },
    ];
  },

  cotizaciones: (lista) => {
    const vencidas = contar(lista, (c) => c.vigencia_hasta < hoyISO());
    return [
      { titulo: 'Cotizaciones', valor: entero(lista.length), detalle: `de ${distintos(lista, 'proveedor_id')} proveedor(es)` },
      { titulo: 'Vigentes', valor: entero(lista.length - vencidas), detalle: 'se pueden usar hoy' },
      {
        titulo: 'Vencidas',
        valor: entero(vencidas),
        estado: vencidas ? { tono: 'aviso', texto: 'Pide una nueva cotización' } : { tono: 'bien', texto: 'Todas vigentes' },
      },
      { titulo: 'Productos cotizados', valor: entero(distintos(lista, 'producto_id')), detalle: 'con al menos una oferta' },
    ];
  },

  recepciones: (lista) => [
    { titulo: 'Recepciones', valor: entero(lista.length), detalle: 'entregas registradas' },
    { titulo: 'Órdenes recibidas', valor: entero(distintos(lista, 'orden_id')), detalle: 'con al menos una entrega' },
    { titulo: 'Este mes', valor: entero(contar(lista, (r) => r.fecha.startsWith(mesActual()))), detalle: 'recepciones' },
  ],

  bodegas: (lista) => {
    const sinResponsable = contar(lista, (b) => !b.responsable_id);
    return [
      { titulo: 'Bodegas', valor: entero(lista.length), detalle: `${entero(contar(lista, (b) => b.activa))} activa(s)` },
      {
        titulo: 'Sin responsable',
        valor: entero(sinResponsable),
        estado: sinResponsable ? { tono: 'aviso', texto: 'Asigna un responsable' } : { tono: 'bien', texto: 'Todas tienen responsable' },
      },
    ];
  },

  existencias: (lista) => {
    const bajo = contar(lista, (e) => e.cantidad < e.minimo);
    return [
      { titulo: 'Existencias', valor: entero(lista.length), detalle: `en ${distintos(lista, 'bodega_id')} bodega(s)` },
      { titulo: 'Unidades en bodega', valor: entero(sumar(lista, 'cantidad')), detalle: `de ${distintos(lista, 'producto_id')} producto(s)` },
      {
        titulo: 'Bajo el mínimo',
        valor: entero(bajo),
        estado: bajo ? { tono: 'critico', texto: 'Hay que reponer' } : { tono: 'bien', texto: 'Todo sobre el mínimo' },
      },
    ];
  },

  facturas: (lista) => {
    const vigentes = lista.filter((f) => f.estado !== 'anulada');
    const conSaldo = lista.filter((f) => f.estado === 'pendiente');
    const vencidas = contar(conSaldo, (f) => diasHasta(f.fecha_vencimiento) < 0);
    const saldo = conSaldo.reduce((s, f) => s + Number(f.monto) - Number(f.pagado), 0);
    return [
      { titulo: 'Facturado', valor: dineroCorto(sumar(vigentes, 'monto')), detalle: `${entero(vigentes.length)} factura(s) vigentes` },
      { titulo: 'Saldo por pagar', valor: dineroCorto(saldo), detalle: `${entero(conSaldo.length)} factura(s) pendientes` },
      { titulo: 'Pagadas', valor: entero(contar(lista, (f) => f.estado === 'pagada')), detalle: dineroCorto(sumar(lista.filter((f) => f.estado === 'pagada'), 'monto')) },
      {
        titulo: 'Vencidas',
        valor: entero(vencidas),
        estado: vencidas ? { tono: 'critico', texto: 'Pagar cuanto antes' } : { tono: 'bien', texto: 'Ninguna vencida' },
      },
    ];
  },

  pagos: (lista) => {
    const delMes = lista.filter((p) => p.fecha.startsWith(mesActual()));
    return [
      { titulo: 'Total pagado', valor: dineroCorto(sumar(lista, 'monto')), detalle: `${entero(lista.length)} pago(s)` },
      { titulo: 'Este mes', valor: dineroCorto(sumar(delMes, 'monto')), detalle: `${entero(delMes.length)} pago(s)` },
      { titulo: 'Pago promedio', valor: dineroCorto(promedio(lista, 'monto')), detalle: 'por transacción' },
    ];
  },

  metodosPago: activos('Métodos de pago'),
};
