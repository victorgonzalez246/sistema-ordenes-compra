import { useEffect, useState } from 'react';
import Campo from '../components/Campo';
import CampoPassword from '../components/CampoPassword';
import PantallaAcceso from '../components/PantallaAcceso';
import { useAuth } from '../context/AuthContext';
import { useFormulario } from '../hooks/useFormulario';

export default function Registro() {
  const { token, registrar } = useAuth();
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    nombre: '',
    correo: '',
    password: '',
    confirmacion: '',
  });
  const [noCoincide, setNoCoincide] = useState(false);

  useEffect(() => {
    document.title = 'Crear cuenta · Órdenes de Compra';
  }, []);

  useEffect(() => {
    if (token) window.location.hash = '#/';
  }, [token]);

  function alEnviar(e) {
    e.preventDefault();
    // Comodidad para el usuario; las reglas reales (correo único, mínimo 8) las valida el back end
    if (valores.password !== valores.confirmacion) {
      setNoCoincide(true);
      return;
    }
    setNoCoincide(false);
    enviar(() => registrar({ nombre: valores.nombre.trim(), correo: valores.correo.trim(), password: valores.password }));
  }

  return (
    <PantallaAcceso titulo="Crear una cuenta" subtitulo="Regístrate para gestionar las compras.">
      <form onSubmit={alEnviar} className="acceso-formulario" noValidate>
        {errorGeneral && <div className="alerta alerta-error" role="alert">{errorGeneral}</div>}

        <Campo etiqueta="Nombre completo" error={errores.nombre} requerido>
          <input {...enlazar('nombre')} autoComplete="name" required autoFocus maxLength={100} />
        </Campo>
        <Campo etiqueta="Correo" error={errores.correo} requerido>
          <input {...enlazar('correo')} type="email" autoComplete="email" required maxLength={120} placeholder="nombre@empresa.co.cr" />
        </Campo>
        <Campo etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres" requerido>
          <CampoPassword {...enlazar('password')} autoComplete="new-password" required minLength={8} maxLength={72} />
        </Campo>
        <Campo etiqueta="Confirmar contraseña" error={noCoincide ? 'Las contraseñas no coinciden' : undefined} requerido>
          <CampoPassword {...enlazar('confirmacion')} autoComplete="new-password" required />
        </Campo>

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p className="acceso-cambio">
          ¿Ya tienes cuenta? <a href="#/login">Iniciar sesión</a>
        </p>
      </form>
    </PantallaAcceso>
  );
}
