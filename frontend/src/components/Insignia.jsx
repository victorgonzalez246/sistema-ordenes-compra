// Etiqueta de color para estados y prioridades: <Insignia valor="pagada" />
const TEXTOS = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  recibida: 'Recibida',
  anulada: 'Anulada',
  pagada: 'Pagada',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export default function Insignia({ valor, texto, clase }) {
  return <span className={`insignia ${clase || `estado-${valor}`}`}>{texto || TEXTOS[valor] || valor}</span>;
}

export function InsigniaActivo({ activo, femenino = false }) {
  const texto = activo ? (femenino ? 'Activa' : 'Activo') : femenino ? 'Inactiva' : 'Inactivo';
  return <Insignia texto={texto} clase={activo ? 'insignia-activo' : 'insignia-inactivo'} />;
}
