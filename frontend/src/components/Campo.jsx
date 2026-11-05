// Etiqueta + control + mensaje de error o ayuda
export default function Campo({ etiqueta, error, ayuda, requerido, className = '', children }) {
  return (
    <label className={`campo ${error ? 'campo-con-error' : ''} ${className}`}>
      <span className="campo-etiqueta">
        {etiqueta}
        {requerido && <span className="requerido" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error ? <span className="campo-error">{error}</span> : ayuda && <span className="campo-ayuda">{ayuda}</span>}
    </label>
  );
}
