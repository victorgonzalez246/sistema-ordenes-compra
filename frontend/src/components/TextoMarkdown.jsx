// Muestra el Markdown sencillo de las respuestas (títulos, párrafos, listas, tablas y **negritas**)
// como elementos de React. No usa HTML crudo: el texto siempre se escapa, así que no hay riesgo de inyectar código.
function enLinea(texto) {
  return texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    if (parte.startsWith('`') && parte.endsWith('`')) return <code key={i}>{parte.slice(1, -1)}</code>;
    return parte;
  });
}

const esFilaTabla = (linea) => /^\s*\|.*\|\s*$/.test(linea);
const esSeparador = (linea) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(linea);
const celdas = (linea) => linea.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
// Columnas que son montos o números se alinean a la derecha
const esNumero = (texto) => /^[₡$]?\s?-?[\d.,\s]+(%|\s?[a-zA-Z]{0,6})?$/.test(texto.replace(/\*\*/g, '').trim());

function Tabla({ filas }) {
  const [cabecera, ...cuerpo] = filas;
  const derecha = cabecera.map((_, i) => cuerpo.length > 0 && cuerpo.every((f) => !f[i] || esNumero(f[i])));
  return (
    <div className="md-tabla">
      <table>
        <thead>
          <tr>{cabecera.map((c, i) => <th key={i} className={derecha[i] ? 'derecha' : undefined}>{enLinea(c)}</th>)}</tr>
        </thead>
        <tbody>
          {cuerpo.map((f, i) => (
            <tr key={i}>{cabecera.map((_, j) => <td key={j} className={derecha[j] ? 'derecha' : undefined}>{enLinea(f[j] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TextoMarkdown({ texto }) {
  const lineas = texto.split('\n');
  const bloques = [];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];

    // Tabla: fila de encabezado, separador |---| y filas
    if (esFilaTabla(linea) && i + 1 < lineas.length && esSeparador(lineas[i + 1])) {
      const filas = [celdas(linea)];
      i += 2;
      while (i < lineas.length && esFilaTabla(lineas[i])) filas.push(celdas(lineas[i++]));
      bloques.push(<Tabla key={`t${i}`} filas={filas} />);
      continue;
    }

    // Lista con viñetas o numerada; la sangría marca los sub-elementos
    if (/^\s*(?:[-*•]|\d+\.)\s+/.test(linea)) {
      const items = [];
      while (i < lineas.length && /^\s*(?:[-*•]|\d+\.)\s+/.test(lineas[i])) {
        const nivel = Math.min(Math.floor(lineas[i].match(/^\s*/)[0].length / 2), 3);
        items.push(
          <li key={i} className={nivel ? `md-nivel-${nivel}` : undefined}>
            {enLinea(lineas[i].replace(/^\s*(?:[-*•]|\d+\.)\s+/, ''))}
          </li>
        );
        i += 1;
      }
      bloques.push(<ul key={`l${i}`}>{items}</ul>);
      continue;
    }

    const titulo = linea.match(/^#{1,4}\s+(.*)/);
    if (titulo) bloques.push(<p key={i} className="md-titulo">{enLinea(titulo[1])}</p>);
    else if (/^\s*-{3,}\s*$/.test(linea)) bloques.push(<hr key={i} />);
    else if (linea.trim()) bloques.push(<p key={i}>{enLinea(linea)}</p>);
    i += 1;
  }
  return <div className="md">{bloques}</div>;
}
