/**
 * Matriz de aprobación de órdenes de compra (Quiz #2, ejercicio A1), aplicada dentro del sistema:
 * una orden queda pendiente hasta que la apruebe el rol correcto.
 *
 * | Monto evaluado              | Aprueba                        | Cotizaciones        |
 * |-----------------------------|--------------------------------|---------------------|
 * | hasta ₡250 000              | Jefatura del área solicitante  | 1                   |
 * | ₡250 001 a ₡2 000 000       | Jefatura de Compras            | 2                   |
 * | ₡2 000 001 a ₡10 000 000    | Gerencia Financiera            | 3                   |
 * | más de ₡10 000 000          | Gerencia General               | 3 + acta de comité  |
 *
 * Mejora contra el fraccionamiento (dividir una compra grande en varias pequeñas para
 * quedar bajo un umbral): el monto evaluado no es solo el total de la orden, sino la suma
 * con las demás órdenes no anuladas del mismo departamento y proveedor dentro de una
 * ventana de días (APROBACION_VENTANA_DIAS, 30 por defecto). Si la suma cruza un umbral,
 * la orden sube de nivel.
 *
 * Un rol superior puede aprobar lo que corresponde a uno inferior. La Jefatura de área
 * solo aprueba órdenes de su propio departamento.
 */

const ROLES = {
  solicitante: { nivel: 0, texto: 'Solicitante' },
  jefatura_area: { nivel: 1, texto: 'Jefatura del área solicitante' },
  jefatura_compras: { nivel: 2, texto: 'Jefatura de Compras' },
  gerencia_financiera: { nivel: 3, texto: 'Gerencia Financiera' },
  gerencia_general: { nivel: 4, texto: 'Gerencia General' },
};

const MATRIZ = [
  { hasta: 250000, rol: 'jefatura_area', cotizaciones: 1, comite: false },
  { hasta: 2000000, rol: 'jefatura_compras', cotizaciones: 2, comite: false },
  { hasta: 10000000, rol: 'gerencia_financiera', cotizaciones: 3, comite: false },
  { hasta: Infinity, rol: 'gerencia_general', cotizaciones: 3, comite: true },
];

const redondear = (n) => Math.round(n * 100) / 100;

// Fila de la matriz que corresponde a un monto
function nivelPara(monto) {
  const fila = MATRIZ.find((f) => Number(monto) <= f.hasta);
  return { ...fila, nivel: ROLES[fila.rol].nivel, aprueba: ROLES[fila.rol].texto };
}

/**
 * ¿Puede este usuario aprobar con este nivel requerido?
 * Devuelve { puede, motivo }.
 */
function permisoUsuario(usuario, requerido, departamentoOrden) {
  const rol = ROLES[usuario?.rol] ?? ROLES.solicitante;
  if (rol.nivel < requerido.nivel) {
    return { puede: false, motivo: `Esta orden la aprueba ${requerido.aprueba}; tu rol es ${rol.texto}` };
  }
  // La jefatura de área solo aprueba lo de su departamento
  if (usuario.rol === 'jefatura_area' && usuario.departamento_id !== departamentoOrden) {
    return { puede: false, motivo: 'La jefatura de área solo aprueba órdenes de su propio departamento' };
  }
  return { puede: true, motivo: null };
}

/**
 * Evalúa una orden contra la matriz. Función pura: recibe todo lo que necesita.
 * @param orden        { id, total, fecha, departamento_id, lineas: [{ producto_id, producto }] }
 * @param relacionadas órdenes no anuladas del mismo departamento y proveedor dentro de la ventana
 * @param cotizacionesPorProducto Map producto_id -> cantidad de proveedores distintos con cotización vigente
 * @param usuario      { rol, departamento_id }
 * @param actaComite   número de acta (obligatorio si el nivel lo pide)
 */
function evaluar({ orden, relacionadas = [], cotizacionesPorProducto = new Map(), usuario, actaComite }) {
  const montoOrden = Number(orden.total);
  const acumulado = redondear(relacionadas.reduce((s, o) => s + Number(o.total), 0));
  const montoEvaluado = redondear(montoOrden + acumulado);

  const porMonto = nivelPara(montoOrden);
  const requerido = nivelPara(montoEvaluado);
  const fraccionamiento = requerido.nivel > porMonto.nivel;

  const productos = new Map(orden.lineas.map((l) => [l.producto_id, l.producto]));
  const cotizaciones = [...productos.entries()].map(([producto_id, producto]) => {
    const tiene = cotizacionesPorProducto.get(producto_id) ?? 0;
    return { producto_id, producto, tiene, requeridas: requerido.cotizaciones, cumple: tiene >= requerido.cotizaciones };
  });

  const bloqueos = [];
  for (const c of cotizaciones.filter((x) => !x.cumple)) {
    bloqueos.push({
      campo: 'cotizaciones',
      mensaje: `${c.producto}: tiene ${c.tiene} cotización(es) vigente(s) de proveedores distintos y se requieren ${c.requeridas}`,
    });
  }
  if (requerido.comite && !actaComite) {
    bloqueos.push({ campo: 'acta_comite', mensaje: 'Más de ₡10 000 000: indique el número de acta del comité de compras' });
  }

  const permiso = usuario ? permisoUsuario(usuario, requerido, orden.departamento_id) : { puede: false, motivo: null };

  return {
    monto_orden: montoOrden,
    monto_acumulado: acumulado,
    monto_evaluado: montoEvaluado,
    ordenes_relacionadas: relacionadas.map((o) => ({ id: o.id, numero: o.numero, fecha: o.fecha, estado: o.estado, total: Number(o.total) })),
    fraccionamiento,
    nivel_por_monto: { rol: porMonto.rol, aprueba: porMonto.aprueba },
    requerido: {
      rol: requerido.rol,
      aprueba: requerido.aprueba,
      cotizaciones: requerido.cotizaciones,
      comite: requerido.comite,
    },
    cotizaciones,
    bloqueos,
    usuario: { rol: usuario?.rol ?? null, puede_aprobar: permiso.puede, motivo: permiso.motivo },
    se_puede_aprobar: permiso.puede && bloqueos.length === 0,
  };
}

module.exports = { ROLES, MATRIZ, nivelPara, permisoUsuario, evaluar };
