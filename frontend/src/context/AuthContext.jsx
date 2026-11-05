import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiFetch, configurarAutenticacion } from '../services/api';

const CLAVE_TOKEN = 'oc-token';
const AuthContext = createContext(null);

// El navegador puede bloquear localStorage (modo privado, permisos): en ese caso la sesión dura lo que la pestaña
function leerGuardado() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardar(token) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Sin almacenamiento: el token queda solo en memoria
  }
}

// Fecha de vencimiento (ms) leída del payload; el front solo la usa para cerrar la sesión a tiempo,
// la validez real la decide siempre el back end al verificar la firma
function vencimiento(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

function tokenInicial() {
  const token = leerGuardado();
  if (token && vencimiento(token) > Date.now()) return token;
  guardar(null);
  return null;
}

const SESION_VENCIDA = 'Tu sesión venció o ya no es válida. Inicia sesión de nuevo.';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(tokenInicial);
  const [usuario, setUsuario] = useState(null);
  const [aviso, setAviso] = useState('');
  const [destino, setDestino] = useState('/');
  const tokenActual = useRef(token);
  tokenActual.current = token;

  const cerrarSesion = useCallback((mensaje = '') => {
    guardar(null);
    setToken(null);
    setUsuario(null);
    setAviso(mensaje);
  }, []);

  // api.js lee el token en cada petición y avisa si la API responde 401
  configurarAutenticacion({
    token: () => tokenActual.current,
    noAutorizado: () => cerrarSesion(SESION_VENCIDA),
  });

  // Al recargar la página: se confirma el token con GET /api/auth/me
  useEffect(() => {
    if (!token || usuario) return;
    apiFetch('/auth/me')
      .then(setUsuario)
      .catch(() => {});
  }, [token, usuario]);

  // Cierra la sesión justo cuando vence el token
  useEffect(() => {
    if (!token) return undefined;
    const restante = vencimiento(token) - Date.now();
    if (restante <= 0) {
      cerrarSesion(SESION_VENCIDA);
      return undefined;
    }
    const temporizador = setTimeout(() => cerrarSesion(SESION_VENCIDA), Math.min(restante, 2 ** 31 - 1));
    return () => clearTimeout(temporizador);
  }, [token, cerrarSesion]);

  async function iniciarSesion(correo, password) {
    const r = await apiFetch('/auth/login', { method: 'POST', body: { correo, password }, publica: true });
    guardar(r.token);
    tokenActual.current = r.token;
    setAviso('');
    setUsuario(r.usuario);
    setToken(r.token);
  }

  async function registrar({ nombre, correo, password }) {
    await apiFetch('/auth/register', { method: 'POST', body: { nombre, correo, password }, publica: true });
    await iniciarSesion(correo, password);
  }

  const valor = { token, usuario, aviso, destino, setDestino, iniciarSesion, registrar, cerrarSesion };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
