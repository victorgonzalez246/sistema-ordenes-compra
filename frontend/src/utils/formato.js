// Montos en colones costarricenses: ₡1 234 567,50
const colones = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' });

export function dinero(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return colones.format(Number(valor));
}

// "2026-11-05" -> "05/11/2026"
export function fecha(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function hoyISO() {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Convierte los detalles de un error de la API en { campo: mensaje }
export function erroresPorCampo(error) {
  const mapa = {};
  for (const d of error?.detalles || []) {
    if (d.campo && !mapa[d.campo]) mapa[d.campo] = d.mensaje;
  }
  return mapa;
}

// "" -> null y texto numérico -> número, para campos opcionales
export function numeroONulo(valor) {
  return valor === '' || valor === null || valor === undefined ? null : Number(valor);
}

export function textoONulo(valor) {
  const limpio = (valor ?? '').trim();
  return limpio === '' ? null : limpio;
}
