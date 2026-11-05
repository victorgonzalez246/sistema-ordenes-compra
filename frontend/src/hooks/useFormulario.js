import { useState } from 'react';
import { erroresPorCampo } from '../utils/formato';

// Estado de un formulario y errores devueltos por la API
export function useFormulario(inicial) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => {
      if (!e[campo]) return e;
      const { [campo]: _quitado, ...resto } = e;
      return resto;
    });
  }

  // Props para enlazar un input: <input {...enlazar('nombre')} />
  function enlazar(campo) {
    return {
      name: campo,
      value: valores[campo] ?? '',
      onChange: (e) => cambiar(campo, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
      'aria-invalid': errores[campo] ? true : undefined,
    };
  }

  async function enviar(accion) {
    setEnviando(true);
    setErrorGeneral('');
    setErrores({});
    try {
      await accion();
    } catch (e) {
      setErrores(erroresPorCampo(e));
      setErrorGeneral(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return { valores, setValores, cambiar, enlazar, errores, errorGeneral, enviando, enviar };
}
