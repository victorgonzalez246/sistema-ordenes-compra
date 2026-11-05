// Botones Cancelar / Guardar al pie de un formulario en modal
export default function PieFormulario({ enviando, onCancelar, textoGuardar = 'Guardar', children }) {
  return (
    <footer className="modal-pie">
      {children && <div className="pie-izquierda">{children}</div>}
      <button type="button" className="btn" onClick={onCancelar} disabled={enviando}>
        Cancelar
      </button>
      <button type="submit" className="btn btn-primario" disabled={enviando}>
        {enviando ? 'Guardando…' : textoGuardar}
      </button>
    </footer>
  );
}
