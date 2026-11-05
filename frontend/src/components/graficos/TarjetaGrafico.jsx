import { useState } from 'react';

/**
 * Tarjeta de un gráfico con título, leyenda y una vista en tabla con los mismos datos.
 * leyenda: [{ color, texto }] (solo cuando hay dos o más series)
 * tabla:   { columnas: ['Mes', 'Monto'], filas: [['Oct', '₡1 000']], derecha: [1] }
 */
export default function TarjetaGrafico({ titulo, subtitulo, leyenda, tabla, pie, children }) {
  const [vista, setVista] = useState('grafico');

  return (
    <article className="tarjeta grafico">
      <header className="grafico-cabecera">
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <p className="texto-suave">{subtitulo}</p>}
        </div>
        {tabla && (
          <div className="selector-vista" role="group" aria-label={`Vista de ${titulo.toLowerCase()}`}>
            {[
              ['grafico', 'Gráfico'],
              ['tabla', 'Tabla'],
            ].map(([valor, texto]) => (
              <button key={valor} type="button" aria-pressed={vista === valor} onClick={() => setVista(valor)}>
                {texto}
              </button>
            ))}
          </div>
        )}
      </header>

      {leyenda && vista === 'grafico' && (
        <ul className="leyenda">
          {leyenda.map((l) => (
            <li key={l.texto}>
              <span className="leyenda-muestra" style={{ background: l.color }} />
              {l.texto}
            </li>
          ))}
        </ul>
      )}

      <div className="grafico-cuerpo">
        {vista === 'grafico' || !tabla ? (
          children
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla-compacta">
              <thead>
                <tr>
                  {tabla.columnas.map((c, i) => (
                    <th key={c} className={tabla.derecha?.includes(i) ? 'derecha' : undefined}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabla.filas.map((fila) => (
                  <tr key={fila[0]}>
                    {fila.map((celda, i) => (
                      <td key={i} data-titulo={tabla.columnas[i]} className={tabla.derecha?.includes(i) ? 'derecha' : undefined}>
                        {celda}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pie}
    </article>
  );
}
