/**
 * Limita cuántas peticiones puede hacer cada cliente en una ventana de tiempo.
 * Se guarda en memoria (suficiente para un solo servidor); al reiniciar se reinicia el conteo.
 *
 * @param maximo   peticiones permitidas por ventana
 * @param ventanaMs duración de la ventana en milisegundos
 * @param clave    (req) => identificador del cliente (usuario o IP)
 * @param mensaje  texto del error 429
 */
function limiteUso({ maximo, ventanaMs, clave, mensaje }) {
  const registros = new Map(); // clave -> { inicio, cantidad }

  // Limpieza periódica para no acumular memoria
  setInterval(() => {
    const ahora = Date.now();
    for (const [k, r] of registros) if (ahora - r.inicio >= ventanaMs) registros.delete(k);
  }, ventanaMs).unref();

  return function limitar(req, res, next) {
    const k = clave(req);
    const ahora = Date.now();
    let r = registros.get(k);
    if (!r || ahora - r.inicio >= ventanaMs) {
      r = { inicio: ahora, cantidad: 0 };
      registros.set(k, r);
    }
    r.cantidad += 1;

    const restantes = Math.max(maximo - r.cantidad, 0);
    const segundos = Math.ceil((r.inicio + ventanaMs - ahora) / 1000);
    res.setHeader('RateLimit-Limit', String(maximo));
    res.setHeader('RateLimit-Remaining', String(restantes));
    res.setHeader('RateLimit-Reset', String(segundos));

    if (r.cantidad > maximo) {
      res.setHeader('Retry-After', String(segundos));
      return res.status(429).json({
        error: mensaje,
        detalles: [{ campo: 'limite', mensaje: `Intenta de nuevo en ${segundos} segundo(s)` }],
      });
    }
    return next();
  };
}

// Valores configurables desde el .env
const numero = (valor, porDefecto) => (Number.isFinite(Number(valor)) && Number(valor) > 0 ? Number(valor) : porDefecto);

// Login: por IP, contra ataques de fuerza bruta
const limiteLogin = limiteUso({
  maximo: numero(process.env.LIMITE_LOGIN, 30),
  ventanaMs: 15 * 60 * 1000,
  clave: (req) => req.ip,
  mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
});

// Asistente: por usuario, porque cada pregunta cuesta dinero en la API de Anthropic
const limiteAsistente = limiteUso({
  maximo: numero(process.env.LIMITE_ASISTENTE, 10),
  ventanaMs: 60 * 1000,
  clave: (req) => `usuario-${req.usuario?.id ?? req.ip}`,
  mensaje: 'Alcanzaste el límite de preguntas al asistente por minuto. Espera un momento.',
});

module.exports = { limiteUso, limiteLogin, limiteAsistente };
