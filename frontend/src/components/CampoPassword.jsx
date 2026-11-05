import { useState } from 'react';

// Campo de contraseña con botón para mostrarla u ocultarla
export default function CampoPassword(props) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="campo-password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="campo-password-boton"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? 'Ocultar' : 'Ver'}
      </button>
    </span>
  );
}
