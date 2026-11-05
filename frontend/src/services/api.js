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

// AuthContext registra aquí cómo leer el token y qué hacer si la API responde 401
let leerToken = () => null;
let alNoAutorizado = () => {};

export function configurarAutenticacion({ token, noAutorizado }) {
  leerToken = token;
  alNoAutorizado = noAutorizado;
}

// Para las peticiones que no pasan por apiFetch (por ejemplo, respuestas transmitidas en vivo)
export const tokenActual = () => leerToken();
export const avisarNoAutorizado = () => alNoAutorizado();

/**
 * Llamada común a la API. Agrega "Authorization: Bearer <token>" a todas las peticiones,
 * salvo las públicas (login y registro), donde un 401 significa credenciales incorrectas.
 */
export async function apiFetch(ruta, { method = 'GET', body, publica = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = leerToken();
  if (token && !publica) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté encendida.', 0);
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);

  // Token vencido o inválido: se cierra la sesión y se vuelve al login
  if (respuesta.status === 401 && !publica) {
    alNoAutorizado();
    throw new ApiError('Tu sesión venció. Inicia sesión de nuevo.', 401);
  }

  if (!respuesta.ok) {
    throw new ApiError(datos?.error || `Error ${respuesta.status}`, respuesta.status, datos?.detalles || []);
  }
  return datos;
}
