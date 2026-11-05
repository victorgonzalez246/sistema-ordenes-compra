// Muestra el Markdown sencillo de las respuestas (párrafos, listas, **negritas**) como elementos de React.
// No usa HTML crudo: el texto siempre se escapa, así que no hay riesgo de inyectar código.
function enLinea(texto) {
  return texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    if (parte.startsWith('`') && parte.endsWith('`')) return <code key={i}>{parte.slice(1, -1)}</code>;
    return parte;
  });
}

export default function TextoMarkdown({ texto }) {
  const bloques = [];
  let lista = null;
  texto.split('\n').forEach((linea, i) => {
    const item = linea.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (item) {
      if (!lista) {
        lista = [];
        bloques.push(<ul key={`l${i}`}>{lista}</ul>);
      }
      lista.push(<li key={i}>{enLinea(item[1])}</li>);
      return;
    }
    lista = null;
    const titulo = linea.match(/^#{1,4}\s+(.*)/);
    if (titulo) bloques.push(<p key={i} className="md-titulo">{enLinea(titulo[1])}</p>);
    else if (linea.trim()) bloques.push(<p key={i}>{enLinea(linea)}</p>);
  });
  return <div className="md">{bloques}</div>;
}
