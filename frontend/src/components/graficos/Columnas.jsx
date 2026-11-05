import Tooltip from './Tooltip';
import { useTooltip } from './useTooltip';

// Marcas del eje Y en números redondos (1, 2, 2,5 o 5 por potencia de 10)
function marcasEje(maximo, cantidad = 4) {
  if (maximo <= 0) return [0];
  const bruto = maximo / cantidad;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto);
  const tope = Math.ceil(maximo / paso) * paso;
  return Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);
}

/**
 * Columnas de una sola serie con eje Y, líneas guía y el valor sobre cada columna.
 * datos: [{ etiqueta, valor, detalle }]
 */
export default function Columnas({ datos, formato, formatoEje, color = 'var(--serie-1)', nombre }) {
  const { area, tip, eventos } = useTooltip();
  const marcas = marcasEje(Math.max(...datos.map((d) => d.valor), 0));
  const tope = marcas[marcas.length - 1] || 1;

  return (
    <div className="columnas" ref={area}>
      <div className="columnas-plano">
        {marcas.map((m) => (
          <div key={m} className={`columnas-guia ${m === 0 ? 'columnas-base' : ''}`} style={{ bottom: `${(m / tope) * 100}%` }}>
            <span>{formatoEje(m)}</span>
          </div>
        ))}
        <div className="columnas-grupos">
          {datos.map((d) => (
            <div
              key={d.etiqueta}
              className="columna-hueco"
              aria-label={`${d.etiqueta}: ${formato(d.valor)}`}
              {...eventos({
                titulo: d.etiqueta,
                filas: [{ color, etiqueta: d.detalle || nombre, valor: formato(d.valor) }],
              })}
            >
              {d.valor > 0 && (
                <>
                  <span className="columna-valor" style={{ bottom: `calc(${(d.valor / tope) * 100}% + 4px)` }}>
                    {formatoEje(d.valor)}
                  </span>
                  <span className="columna" style={{ height: `${(d.valor / tope) * 100}%`, background: color }} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="columnas-eje-x">
        {datos.map((d) => (
          <span key={d.etiqueta}>{d.etiqueta}</span>
        ))}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}
