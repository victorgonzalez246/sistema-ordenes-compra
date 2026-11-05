import { useEffect, useId } from 'react';

// Ventana modal; se cierra con Escape o al hacer clic fuera
export default function Modal({ titulo, onCerrar, ancho = 'md', children }) {
  const idTitulo = useId();

  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPresionar);
    document.body.classList.add('sin-scroll');
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.classList.remove('sin-scroll');
    };
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className={`modal modal-${ancho}`} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <header className="modal-cabecera">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
