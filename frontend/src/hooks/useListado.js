import { useCallback, useEffect, useState } from 'react';

// Carga datos con una función async y expone el estado de carga y error
export function useListado(cargar) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await cargar());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}
