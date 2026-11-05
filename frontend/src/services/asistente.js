import { API_URL, ApiError, apiFetch, avisarNoAutorizado, tokenActual } from './api';

export const estadoAsistente = () => apiFetch('/asistente/estado');

/**
 * Envía una pregunta al asistente y entrega cada evento apenas llega
 * (el back end responde una línea JSON por paso: delegar, herramienta, respuesta...).
 */
export async function preguntarAsistente({ pregunta, historial, alEvento, senal }) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/asistente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenActual()}` },
      body: JSON.stringify({ pregunta, historial }),
      signal: senal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté encendida.', 0);
  }

  if (respuesta.status === 401) {
    avisarNoAutorizado();
    throw new ApiError('Tu sesión venció. Inicia sesión de nuevo.', 401);
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new ApiError(datos?.error || `Error ${respuesta.status}`, respuesta.status, datos?.detalles || []);
  }

  const lector = respuesta.body.getReader();
  const decodificador = new TextDecoder();
  let pendiente = '';
  for (;;) {
    const { value, done } = await lector.read();
    if (done) break;
    pendiente += decodificador.decode(value, { stream: true });
    const lineas = pendiente.split('\n');
    pendiente = lineas.pop();
    for (const linea of lineas) if (linea.trim()) alEvento(JSON.parse(linea));
  }
  if (pendiente.trim()) alEvento(JSON.parse(pendiente));
}
