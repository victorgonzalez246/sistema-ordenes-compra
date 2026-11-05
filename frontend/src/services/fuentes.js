import {
  bodegasApi,
  categoriasApi,
  departamentosApi,
  empleadosApi,
  facturasApi,
  metodosPagoApi,
  ordenesApi,
  productosApi,
  proveedoresApi,
} from './recursos';
import { dinero } from '../utils/formato';

// Listas desplegables de otras entidades para los formularios (campo tipo "relacion")
export const fuentes = {
  departamento: { api: departamentosApi, texto: (d) => `${d.nombre} · ${d.centro_costo}` },
  empleado: { api: empleadosApi, texto: (e) => `${e.nombre} · ${e.puesto}`, filtro: (e) => e.activo },
  proveedor: { api: proveedoresApi, texto: (p) => p.razon_social },
  proveedorActivo: { api: proveedoresApi, texto: (p) => p.razon_social, filtro: (p) => p.activo },
  categoria: { api: categoriasApi, texto: (c) => c.nombre },
  producto: { api: productosApi, texto: (p) => `${p.codigo} · ${p.nombre}` },
  bodega: { api: bodegasApi, texto: (b) => b.nombre, filtro: (b) => b.activa },
  // Solo se reciben y facturan órdenes aprobadas o recibidas
  ordenAprobada: {
    api: ordenesApi,
    texto: (o) => `${o.numero} · ${o.proveedor?.razon_social ?? ''} · ${dinero(o.total)}`,
    filtro: (o) => o.estado === 'aprobada' || o.estado === 'recibida',
  },
  facturaPendiente: {
    api: facturasApi,
    texto: (f) => `${f.numero} · saldo ${dinero(f.monto - f.pagado)}`,
    filtro: (f) => f.estado === 'pendiente',
  },
  metodoPago: { api: metodosPagoApi, texto: (m) => m.nombre, filtro: (m) => m.activo },
};
