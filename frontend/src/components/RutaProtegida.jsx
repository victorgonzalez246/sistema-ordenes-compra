import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Sin token, guarda a dónde quería ir el usuario y lo manda a #/login
export default function RutaProtegida({ ruta, children }) {
  const { token, setDestino } = useAuth();

  useEffect(() => {
    if (!token) {
      setDestino(ruta);
      window.location.hash = '#/login';
    }
  }, [token, ruta, setDestino]);

  return token ? children : null;
}
