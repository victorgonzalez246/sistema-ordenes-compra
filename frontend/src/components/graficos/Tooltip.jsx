// Recuadro flotante: el valor va primero y en negrita; la serie se identifica con una línea de color
export default function Tooltip({ tip }) {
  if (!tip) return null;
  const { titulo, filas } = tip.contenido;
  return (
    <div className="tooltip" role="status" style={{ left: tip.x, top: tip.y }}>
      {titulo && <div className="tooltip-titulo">{titulo}</div>}
      {filas.map((f) => (
        <div key={f.etiqueta} className="tooltip-fila">
          {f.color && <span className="tooltip-clave" style={{ background: f.color }} />}
          <strong>{f.valor}</strong>
          <span>{f.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
