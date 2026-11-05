import Tooltip from './Tooltip';
import { useTooltip } from './useTooltip';

const porcentaje = (n) => `${Math.round(n)} %`;

/**
 * Un total dividido en partes (barra alta de 28px). Cada bloque muestra su porcentaje
 * si cabe; el nombre, el monto y la participación están en el tooltip y la tabla.
 * datos: [{ etiqueta, valor, color, textoOscuro }]
 */
export default function BarraSegmentada({ datos, formato }) {
  const { area, tip, eventos } = useTooltip();
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const visibles = datos.filter((d) => d.valor > 0);

  if (total === 0) return <p className="estado-tabla">Sin datos para mostrar.</p>;

  return (
    <div className="segmentada" ref={area}>
      <div className="segmentada-barra" role="img" aria-label={visibles.map((d) => `${d.etiqueta} ${porcentaje((d.valor / total) * 100)}`).join(', ')}>
        {visibles.map((d) => {
          const parte = (d.valor / total) * 100;
          return (
            <span
              key={d.etiqueta}
              className="segmentada-bloque"
              style={{ flexGrow: d.valor, background: d.color, color: d.textoOscuro ? '#0b0b0b' : '#ffffff' }}
              {...eventos({
                titulo: d.etiqueta,
                filas: [{ color: d.color, etiqueta: `${porcentaje(parte)} del total`, valor: formato(d.valor) }],
              })}
            >
              {parte >= 10 ? porcentaje(parte) : ''}
            </span>
          );
        })}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}
