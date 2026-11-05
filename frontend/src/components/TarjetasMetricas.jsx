// Fila de indicadores. Un estado (alerta/aviso/bien) siempre lleva icono y texto, nunca solo color.
const ICONOS = {
  critico: 'M12 8v5m0 3h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  aviso: 'M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  bien: 'm8 12.5 2.5 2.5L16 9.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

export function EstadoMetrica({ tono, texto }) {
  return (
    <span className={`metrica-estado metrica-${tono}`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d={ICONOS[tono]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {texto}
    </span>
  );
}

/**
 * metricas: [{ titulo, valor, detalle, estado: { tono: 'critico' | 'aviso' | 'bien', texto } }]
 */
export default function TarjetasMetricas({ metricas }) {
  return (
    <div className="metricas">
      {metricas.map((m) => (
        <article key={m.titulo} className="metrica">
          <span className="metrica-titulo">{m.titulo}</span>
          <span className="metrica-valor">{m.valor}</span>
          {m.detalle && <span className="metrica-detalle">{m.detalle}</span>}
          {m.estado && <EstadoMetrica {...m.estado} />}
        </article>
      ))}
    </div>
  );
}
