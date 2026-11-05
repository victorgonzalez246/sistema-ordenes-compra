const Anthropic = require('@anthropic-ai/sdk');
const { responder, MODELO, DESCRIPCION_AGENTES } = require('../asistente/agentes');
const { datosValidados } = require('../validators/comunes');

// El cliente lee ANTHROPIC_API_KEY del .env; se crea solo cuando hay clave
let cliente = null;
function obtenerCliente() {
  if (cliente) return cliente;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cliente = new Anthropic();
  return cliente;
}

// Para las pruebas: permite usar un cliente simulado sin gastar en la API
function usarClientePrueba(simulado) {
  cliente = simulado;
}

// GET /api/asistente/estado
function estado(req, res) {
  res.json({ configurado: Boolean(cliente || process.env.ANTHROPIC_API_KEY), modelo: MODELO, agentes: DESCRIPCION_AGENTES });
}

function mensajeDeError(e) {
  if (e instanceof Anthropic.AuthenticationError) return 'La clave ANTHROPIC_API_KEY no es válida. Revisa backend/.env.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'La clave no tiene permiso para usar este modelo.';
  if (e instanceof Anthropic.RateLimitError) return 'Se alcanzó el límite de uso de la API. Espera un momento e intenta de nuevo.';
  if (e instanceof Anthropic.APIConnectionError) return 'No se pudo conectar con la API de Anthropic. Revisa la conexión a internet.';
  if (e instanceof Anthropic.APIError) return `La API de Anthropic respondió con un error (${e.status}).`;
  if (e.esRechazo) return e.message;
  return 'Ocurrió un error inesperado en el asistente.';
}

/**
 * POST /api/asistente  { pregunta, historial }
 * Responde como un flujo NDJSON: una línea JSON por cada paso (el cerebro piensa,
 * delega en un agente, el agente consulta MySQL, el agente responde, respuesta final).
 */
async function preguntar(req, res) {
  const cli = obtenerCliente();
  if (!cli) {
    return res.status(503).json({
      error: 'El asistente no está configurado: falta ANTHROPIC_API_KEY en backend/.env',
      detalles: [],
    });
  }

  const { pregunta, historial = [] } = datosValidados(req);

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let cerrado = false;
  req.on('close', () => {
    cerrado = true;
  });
  const emitir = (evento) => {
    if (!cerrado) res.write(`${JSON.stringify({ ...evento, t: Date.now() })}\n`);
  };

  try {
    await responder({ cliente: cli, pregunta, historial, emitir });
  } catch (e) {
    if (!(e instanceof Anthropic.APIError) && !e.esRechazo) console.error('Asistente:', e);
    emitir({ tipo: 'error', mensaje: mensajeDeError(e) });
  } finally {
    emitir({ tipo: 'fin' });
    res.end();
  }
  return undefined;
}

module.exports = { estado, preguntar, usarClientePrueba };
