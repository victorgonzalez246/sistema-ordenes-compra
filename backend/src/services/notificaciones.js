/**
 * Avisos externos opcionales (Slack, Discord o cualquier webhook que acepte JSON).
 * Si ALERTAS_WEBHOOK_URL está vacío, los avisos solo quedan en la base de datos y en la consola.
 * El cuerpo incluye "text" (Slack) y "content" (Discord), así sirve para ambos.
 * Un fallo al avisar nunca deshace lo que ya se guardó: solo se registra en consola.
 */
async function enviarAviso(texto) {
  const url = process.env.ALERTAS_WEBHOOK_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, content: texto }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (error) {
    console.error('No se pudo enviar el aviso:', error.message);
    return false;
  }
}

// Avisa solo cuando una alerta de reorden se abre o pasa a urgente (no en cada actualización)
async function notificarAlerta({ accion, alerta, producto }) {
  if (!['abierta', 'escalada'].includes(accion)) return false;

  const icono = alerta.prioridad === 'urgente' ? '🔴' : '🟠';
  return enviarAviso(
    `${icono} Reorden ${alerta.prioridad.toUpperCase()}: ${producto.codigo} · ${producto.nombre}\n` +
      `Stock actual: ${alerta.stock} ${producto.unidad} · Punto de reorden: ${Number(alerta.punto_reorden)} · ` +
      `Pedir: ${alerta.cantidad_sugerida} ${producto.unidad}`
  );
}

module.exports = { enviarAviso, notificarAlerta };
