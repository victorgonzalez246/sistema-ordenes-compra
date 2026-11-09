import Campo from './Campo';
import { dinero, fecha } from '../utils/formato';

export const TEXTO_ROL = {
  solicitante: 'Solicitante',
  jefatura_area: 'Jefatura del área',
  jefatura_compras: 'Jefatura de Compras',
  gerencia_financiera: 'Gerencia Financiera',
  gerencia_general: 'Gerencia General',
};

// ¿Se puede pulsar "Aprobar"? El acta del comité se escribe aquí mismo, así que no cuenta como bloqueo
export function sePuedeAprobar(aprobacion, acta) {
  if (!aprobacion) return true;
  const bloqueos = aprobacion.bloqueos.filter((b) => b.campo !== 'acta_comite');
  return aprobacion.usuario.puede_aprobar && bloqueos.length === 0 && (!aprobacion.requerido.comite || Boolean(acta.trim()));
}

const Marca = ({ ok }) => (
  <span className={ok ? 'positivo' : 'negativo'} aria-hidden="true">
    {ok ? '✓' : '✗'}
  </span>
);

/**
 * Qué pide la matriz de aprobación (ejercicio A1) para una orden pendiente:
 * nivel requerido, monto evaluado (con las órdenes que se suman contra el fraccionamiento),
 * cotizaciones por producto y si el usuario actual puede aprobar.
 */
export default function PanelAprobacion({ aprobacion, acta, onActa }) {
  if (!aprobacion) return null;
  const { requerido, usuario } = aprobacion;

  return (
    <section className="panel-aprobacion" aria-label="Matriz de aprobación">
      <div className="panel-aprobacion-cabecera">
        <div>
          <span className="texto-suave">La aprueba</span>
          <strong>{requerido.aprueba}</strong>
        </div>
        <div className="derecha">
          <span className="texto-suave">Monto evaluado</span>
          <strong>{dinero(aprobacion.monto_evaluado)}</strong>
        </div>
      </div>

      {aprobacion.fraccionamiento && (
        <div className="alerta alerta-aviso-suave">
          <strong>Posible fraccionamiento.</strong> Esta orden por sí sola ({dinero(aprobacion.monto_orden)}) la aprobaría{' '}
          {aprobacion.nivel_por_monto.aprueba}, pero suma {dinero(aprobacion.monto_acumulado)} con otras órdenes del mismo
          departamento y proveedor en {aprobacion.ventana_dias} días:{' '}
          {aprobacion.ordenes_relacionadas.map((o) => `${o.numero} (${fecha(o.fecha)}, ${dinero(o.total)})`).join(', ')}.
        </div>
      )}
      {!aprobacion.fraccionamiento && aprobacion.ordenes_relacionadas.length > 0 && (
        <p className="texto-suave" style={{ margin: '0 0 8px' }}>
          Incluye {aprobacion.ordenes_relacionadas.map((o) => o.numero).join(', ')} (mismo departamento y proveedor en{' '}
          {aprobacion.ventana_dias} días).
        </p>
      )}

      <ul className="lista-requisitos">
        <li>
          <Marca ok={usuario.puede_aprobar} />{' '}
          {usuario.puede_aprobar ? `Tu rol (${TEXTO_ROL[usuario.rol]}) puede aprobarla` : usuario.motivo}
        </li>
        {aprobacion.cotizaciones.map((c) => (
          <li key={c.producto_id}>
            <Marca ok={c.cumple} /> {c.producto}: {c.tiene} de {c.requeridas} cotización(es) vigente(s) de proveedores distintos
          </li>
        ))}
        {requerido.comite && (
          <li>
            <Marca ok={Boolean(acta.trim())} /> Más de ₡10 000 000: requiere acta del comité de compras
          </li>
        )}
      </ul>

      {requerido.comite && (
        <Campo etiqueta="Número de acta del comité" requerido>
          <input value={acta} onChange={(e) => onActa(e.target.value)} maxLength={40} placeholder="ACTA-2026-07" />
        </Campo>
      )}
    </section>
  );
}

// Para órdenes ya aprobadas: quién, cuándo y con qué nivel
export function RegistroAprobacion({ orden }) {
  if (!orden.aprobada_en) return null;
  return (
    <p className="texto-suave registro-aprobacion">
      Aprobada por <strong>{orden.aprobada_por?.nombre ?? 'un usuario eliminado'}</strong> el{' '}
      {new Date(orden.aprobada_en).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })} · nivel{' '}
      {TEXTO_ROL[orden.nivel_aprobacion] ?? orden.nivel_aprobacion} · monto evaluado {dinero(orden.monto_evaluado)}
      {orden.acta_comite ? ` · acta ${orden.acta_comite}` : ''}
    </p>
  );
}
