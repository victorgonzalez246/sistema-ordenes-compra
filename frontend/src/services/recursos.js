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
export const proveedoresApi = recurso('proveedores');
export const productosApi = recurso('productos');
export const ordenesApi = recurso('ordenes');
