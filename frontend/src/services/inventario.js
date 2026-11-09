import { apiFetch } from './api';

// Consultas del control de inventario (Quiz #2, opción 2)
const query = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  return qs ? `?${qs}` : '';
};

export const movimientosApi = {
  listar: (filtros) => apiFetch(`/movimientos${query(filtros)}`),
  crear: (datos) => apiFetch('/movimientos', { method: 'POST', body: datos }),
};

export const inventarioApi = {
  stock: (productoId) => apiFetch(`/productos/${productoId}/stock`),
  trazabilidad: (productoId, bodegaId) => apiFetch(`/productos/${productoId}/trazabilidad${query({ bodega_id: bodegaId })}`),
  reorden: (incluirOk = false) => apiFetch(`/alertas/reorden${query({ incluir_ok: incluirOk || '' })}`),
  alertas: (filtros) => apiFetch(`/alertas${query(filtros)}`),
  duplicados: (params) => apiFetch(`/ordenes/posibles-duplicados${query(params)}`),
  revisionDiaria: () => apiFetch('/tareas/revision-diaria', { method: 'POST' }),
};

// Textos para mostrar
export const TIPOS_MOVIMIENTO = {
  entrada: 'Entrada',
  salida: 'Salida',
  traslado: 'Traslado',
  ajuste: 'Ajuste',
};

export const DOCUMENTOS = {
  orden_compra: 'Orden de compra',
  inventario_inicial: 'Inventario inicial',
  vale_salida: 'Vale de salida',
  boleta_traslado: 'Boleta de traslado',
  ajuste_inventario: 'Acta de ajuste',
};

export const ESTADOS_REORDEN = {
  urgente: 'Urgente',
  reponer: 'Reponer',
  ok: 'Suficiente',
  sin_parametros: 'Sin parámetros',
};

// Enlace a la pantalla de trazabilidad de un material
export const enlaceTrazabilidad = (productoId) => `#/trazabilidad?producto=${productoId}`;
