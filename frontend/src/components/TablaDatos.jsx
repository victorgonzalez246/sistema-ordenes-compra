// Tabla con estados de carga, error y vacío
export default function TablaDatos({ columnas, filas, cargando, error, onReintentar, vacio, acciones }) {
  if (error) {
    return (
      <div className="estado-tabla estado-error">
        <p>{error}</p>
        {onReintentar && (
          <button type="button" className="btn" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (cargando && filas.length === 0) {
    return <div className="estado-tabla">Cargando…</div>;
  }

  if (filas.length === 0) {
    return <div className="estado-tabla">{vacio}</div>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className={c.alinear === 'derecha' ? 'derecha' : undefined}>
                {c.titulo}
              </th>
            ))}
            {acciones && <th className="derecha">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              {columnas.map((c) => (
                <td key={c.clave} data-titulo={c.titulo} className={c.alinear === 'derecha' ? 'derecha' : undefined}>
                  {c.render ? c.render(fila) : fila[c.clave] ?? '—'}
                </td>
              ))}
              {acciones && (
                <td className="derecha acciones-celda" data-titulo="Acciones">
                  {acciones(fila)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
