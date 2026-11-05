// Montos en colones costarricenses: ₡1 234 567,50
const colones = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' });

export function dinero(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return colones.format(Number(valor));
}

// Montos abreviados para indicadores y ejes: ₡339,6 mil · ₡1,2 M
const colonesCompactos = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function dineroCorto(valor) {
  return colonesCompactos.format(Number(valor) || 0);
}

export const entero = (n) => Number(n || 0).toLocaleString('es-CR');

export const porcentaje = (n) =>
  `${Number(n || 0).toLocaleString('es-CR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

// Días entre hoy y una fecha AAAA-MM-DD (negativo si ya pasó)
export function diasHasta(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((Date.UTC(a, m - 1, d) - inicioHoy) / 86400000);
}

const sumar = (lista, campo) => lista.reduce((s, x) => s + Number(x[campo] || 0), 0);
export { sumar };

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
