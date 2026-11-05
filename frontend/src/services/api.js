// URL base del back end; se puede cambiar con VITE_API_URL en frontend/.env
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Petición JSON genérica; lanza un Error con el mensaje que devuelve la API
export async function apiFetch(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
    ...opciones,
  });

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Error en la petición');
    error.status = respuesta.status;
    error.detalles = datos.detalles || [];
    throw error;
  }
  return datos;
}
