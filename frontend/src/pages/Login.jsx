import { useEffect } from 'react';
import Campo from '../components/Campo';
import CampoPassword from '../components/CampoPassword';
import PantallaAcceso from '../components/PantallaAcceso';
import { useAuth } from '../context/AuthContext';
import { useFormulario } from '../hooks/useFormulario';

export default function Login() {
  const { token, aviso, destino, iniciarSesion } = useAuth();
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({ correo: '', password: '' });

  useEffect(() => {
    document.title = 'Iniciar sesión · Órdenes de Compra';
  }, []);

  // Con sesión iniciada, vuelve a la pantalla que se pidió (o al resumen)
  useEffect(() => {
    if (token) window.location.hash = `#${destino === '/login' || destino === '/registro' ? '/' : destino}`;
  }, [token, destino]);

  function alEnviar(e) {
    e.preventDefault();
    enviar(() => iniciarSesion(valores.correo.trim(), valores.password));
  }

  return (
    <PantallaAcceso titulo="Iniciar sesión" subtitulo="Ingresa con tu correo y contraseña.">
      <form onSubmit={alEnviar} className="acceso-formulario" noValidate>
        {aviso && !errorGeneral && <div className="alerta alerta-aviso" role="status">{aviso}</div>}
        {errorGeneral && <div className="alerta alerta-error" role="alert">{errorGeneral}</div>}

        <Campo etiqueta="Correo" error={errores.correo} requerido>
          <input {...enlazar('correo')} type="email" autoComplete="username" required autoFocus placeholder="nombre@empresa.co.cr" />
        </Campo>
        <Campo etiqueta="Contraseña" error={errores.password} requerido>
          <CampoPassword {...enlazar('password')} autoComplete="current-password" required />
        </Campo>

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <p className="acceso-cambio">
          ¿No tienes cuenta? <a href="#/registro">Crear una cuenta</a>
        </p>
      </form>
    </PantallaAcceso>
  );
}
