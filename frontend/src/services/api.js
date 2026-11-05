// URL base del back end; se puede cambiar con VITE_API_URL en frontend/.env
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Error de la API con el código HTTP y los detalles por campo
export class ApiError extends Error {
  constructor(mensaje, status, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export async function apiFetch(ruta, { method = 'GET', body } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté encendida.', 0);
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ApiError(datos?.error || `Error ${respuesta.status}`, respuesta.status, datos?.detalles || []);
  }
  return datos;
}
