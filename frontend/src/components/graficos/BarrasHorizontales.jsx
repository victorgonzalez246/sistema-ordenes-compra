import Tooltip from './Tooltip';
import { useTooltip } from './useTooltip';

/**
 * Barras horizontales, simples o apiladas.
 * series: [{ clave, nombre, color }]
 * datos:  [{ etiqueta, valores: { clave: número }, nota }]   nota: texto opcional al final
 * El total va en la punta de la barra; el detalle de cada serie, en el tooltip.
 */
export default function BarrasHorizontales({ series, datos, formato }) {
  const { area, tip, eventos } = useTooltip();
  const total = (d) => series.reduce((s, serie) => s + (d.valores[serie.clave] || 0), 0);
  const maximo = Math.max(...datos.map(total), 0) || 1;

  return (
    <div className="barras-h" ref={area}>
      {datos.map((d) => {
        const suma = total(d);
        return (
          <div
            key={d.etiqueta}
            className="barra-h-fila"
            aria-label={`${d.etiqueta}: ${formato(suma)}`}
            {...eventos({
              titulo: d.etiqueta,
              filas: series.map((s) => ({ color: s.color, etiqueta: s.nombre, valor: formato(d.valores[s.clave] || 0) })),
            })}
          >
            <span className="barra-h-etiqueta">{d.etiqueta}</span>
            <div className="barra-h-pista">
              <div className="barra-h-segmentos" style={{ width: `calc((100% - 104px) * ${suma / maximo})` }}>
                {series.map((s) => {
                  const valor = d.valores[s.clave] || 0;
                  if (valor <= 0) return null;
                  return <span key={s.clave} className="barra-h-segmento" style={{ flexGrow: valor, background: s.color }} />;
                })}
              </div>
              <span className="barra-h-valor">
                {formato(suma)}
                {d.nota && <small>{d.nota}</small>}
              </span>
            </div>
          </div>
        );
      })}
      <Tooltip tip={tip} />
    </div>
  );
}
