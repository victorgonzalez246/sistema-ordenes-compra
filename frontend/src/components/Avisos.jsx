import { createContext, useCallback, useContext, useState } from 'react';

const AvisosContext = createContext(() => {});

// Notificaciones breves en la esquina de la pantalla
export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const avisar = useCallback((texto, tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), tipo === 'error' ? 6000 : 3500);
  }, []);

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso-${a.tipo}`}>
            {a.texto}
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
