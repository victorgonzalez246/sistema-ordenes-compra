export const ESTADOS = ['pendiente', 'aprobada', 'recibida', 'anulada'];

export const NOMBRE_ESTADO = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  recibida: 'Recibida',
  anulada: 'Anulada',
};

// Mismas transiciones que valida el back end
export const TRANSICIONES = {
  pendiente: ['aprobada', 'anulada'],
  aprobada: ['recibida', 'anulada'],
  recibida: [],
  anulada: [],
};

export default function EstadoOrden({ estado }) {
  return <span className={`insignia estado-${estado}`}>{NOMBRE_ESTADO[estado] || estado}</span>;
}
