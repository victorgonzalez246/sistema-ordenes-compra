import { useState } from 'react';
import Modal from './Modal';

// Pide confirmación antes de eliminar un registro
export default function ConfirmarEliminar({ titulo = 'Eliminar registro', mensaje, onConfirmar, onCancelar }) {
  const [procesando, setProcesando] = useState(false);

  async function confirmar() {
    setProcesando(true);
    try {
      await onConfirmar();
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={procesando ? () => {} : onCancelar} ancho="sm">
      <div className="modal-cuerpo">
        <p>{mensaje}</p>
        <p className="texto-suave">Esta acción no se puede deshacer.</p>
      </div>
      <footer className="modal-pie">
        <button type="button" className="btn" onClick={onCancelar} disabled={procesando}>
          Cancelar
        </button>
        <button type="button" className="btn btn-peligro" onClick={confirmar} disabled={procesando} autoFocus>
          {procesando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </footer>
    </Modal>
  );
}
