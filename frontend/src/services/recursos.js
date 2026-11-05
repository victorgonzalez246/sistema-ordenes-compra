import { apiFetch } from './api';

// Operaciones CRUD de un recurso REST
function recurso(ruta) {
  return {
    listar(filtros = {}) {
      const params = Object.entries(filtros).filter(([, v]) => v !== '' && v != null);
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/${ruta}${qs ? `?${qs}` : ''}`);
    },
    obtener: (id) => apiFetch(`/${ruta}/${id}`),
    crear: (datos) => apiFetch(`/${ruta}`, { method: 'POST', body: datos }),
    actualizar: (id, datos) => apiFetch(`/${ruta}/${id}`, { method: 'PUT', body: datos }),
    eliminar: (id) => apiFetch(`/${ruta}/${id}`, { method: 'DELETE' }),
  };
}

export const departamentosApi = recurso('departamentos');
export const empleadosApi = recurso('empleados');
export const proveedoresApi = recurso('proveedores');
export const contactosApi = recurso('contactos-proveedor');
export const categoriasApi = recurso('categorias');
export const productosApi = recurso('productos');
export const requisicionesApi = recurso('requisiciones');
export const cotizacionesApi = recurso('cotizaciones');
export const ordenesApi = recurso('ordenes');
export const recepcionesApi = recurso('recepciones');
export const bodegasApi = recurso('bodegas');
export const existenciasApi = recurso('existencias');
export const facturasApi = recurso('facturas');
export const pagosApi = recurso('pagos');
export const metodosPagoApi = recurso('metodos-pago');
export const usuariosApi = recurso('usuarios');
