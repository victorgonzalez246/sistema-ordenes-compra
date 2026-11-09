import { useCallback, useState } from 'react';
import { useListado } from '../hooks/useListado';
import { useAvisos } from '../components/Avisos';
import TablaDatos from '../components/TablaDatos';
import TarjetasMetricas from '../components/TarjetasMetricas';
import Insignia from '../components/Insignia';
import Modal from '../components/Modal';
import { inventarioApi, ESTADOS_REORDEN, enlaceTrazabilidad } from '../services/inventario';
import { entero, fecha } from '../utils/formato';

const COLOR = { urgente: 'var(--peligro)', reponer: 'var(--aviso)', ok: 'var(--exito)' };
const numero = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('es-CR', { maximumFractionDigits: 2 }));

// Barra: stock actual frente al punto de reorden (la marca negra es el PR)
function BarraReorden({ fila }) {
  const tope = Math.max(fila.stock, fila.punto_reorden) * 1.25 || 1;
  return (
    <div
      className="barra-reorden"
      role="img"
      aria-label={`Stock ${fila.stock} frente a punto de reorden ${fila.punto_reorden}`}
      title={`Stock ${entero(fila.stock)} · PR ${numero(fila.punto_reorden)}`}
    >
      <div className="barra-reorden-relleno" style={{ width: `${(fila.stock / tope) * 100}%`, background: COLOR[fila.estado] }} />
      <div className="barra-reorden-marca" style={{ left: `${(fila.punto_reorden / tope) * 100}%` }} />
    </div>
  );
}

const columnasReorden = [
  { clave: 'prioridad', titulo: '#', render: (f) => <strong>{f.prioridad}</strong> },
  {
    clave: 'material',
    titulo: 'Material',
    render: (f) => (
      <div className="celda-material">
        <a href={enlaceTrazabilidad(f.material_id)}>
          <strong>{f.material}</strong>
        </a>
        <div className="texto-suave"><code>{f.codigo}</code></div>
      </div>
    ),
  },
  { clave: 'estado', titulo: 'Estado', render: (f) => <Insignia texto={ESTADOS_REORDEN[f.estado]} clase={`estado-${f.estado}`} /> },
  { clave: 'stock', titulo: 'Stock', alinear: 'derecha', render: (f) => `${entero(f.stock)} ${f.unidad}` },
  { clave: 'barra', titulo: 'Stock vs. PR', render: (f) => <BarraReorden fila={f} /> },
  {
    clave: 'pr',
    titulo: 'Punto reorden',
    alinear: 'derecha',
    render: (f) => (
      <>
        <strong>{numero(f.punto_reorden)}</strong>
        <div className="texto-suave">SS {numero(f.stock_seguridad)}</div>
      </>
    ),
  },
  {
    clave: 'cobertura',
    titulo: 'Cobertura',
    alinear: 'derecha',
    render: (f) => (
      <span title={`Alcanza para ${numero(f.dias_cobertura)} días; el proveedor tarda ${f.tiempo_entrega}`}>
        {numero(f.dias_cobertura)} d / {f.tiempo_entrega} d
      </span>
    ),
  },
  {
    clave: 'sugerida',
    titulo: 'Pedir',
    alinear: 'derecha',
    render: (f) => (f.cantidad_sugerida ? <strong>{entero(f.cantidad_sugerida)} {f.unidad}</strong> : '—'),
  },
];

const columnasHistorial = [
  { clave: 'fecha', titulo: 'Abierta', render: (a) => <span className="sin-corte">{fecha(a.created_at.slice(0, 10))}</span> },
  { clave: 'producto', titulo: 'Material', render: (a) => `${a.producto?.codigo} · ${a.producto?.nombre}` },
  { clave: 'estado', titulo: 'Estado', render: (a) => <Insignia texto={a.estado === 'abierta' ? 'Abierta' : 'Cerrada'} clase={`estado-${a.estado}`} /> },
  { clave: 'prioridad', titulo: 'Prioridad', render: (a) => <Insignia texto={ESTADOS_REORDEN[a.prioridad]} clase={`estado-${a.prioridad}`} /> },
  { clave: 'stock', titulo: 'Stock', alinear: 'derecha', render: (a) => entero(a.stock) },
  { clave: 'pr', titulo: 'PR', alinear: 'derecha', render: (a) => numero(a.punto_reorden) },
  { clave: 'cerrada', titulo: 'Cerrada', render: (a) => (a.cerrada_en ? fecha(a.cerrada_en.slice(0, 10)) : '—') },
];

function metricasReorden(filas) {
  const urgentes = filas.filter((f) => f.estado === 'urgente').length;
  const reponer = filas.filter((f) => f.estado === 'reponer').length;
  const ok = filas.filter((f) => f.estado === 'ok').length;
  return [
    {
      titulo: 'Urgentes',
      valor: entero(urgentes),
      detalle: 'se agotan antes de que llegue un pedido',
      estado: urgentes ? { tono: 'critico', texto: 'Pedir de inmediato' } : { tono: 'bien', texto: 'Ninguno' },
    },
    {
      titulo: 'Por reponer',
      valor: entero(reponer),
      detalle: 'en o bajo el punto de reorden',
      estado: reponer ? { tono: 'aviso', texto: 'Emitir orden hoy' } : { tono: 'bien', texto: 'Ninguno' },
    },
    { titulo: 'Con stock suficiente', valor: entero(ok), detalle: 'por encima del punto de reorden' },
  ];
}

export default function AlertasReordenPage() {
  const [verTodos, setVerTodos] = useState(false);
  const cargarReorden = useCallback(() => inventarioApi.reorden(true), []);
  const reorden = useListado(cargarReorden);
  const [estadoHistorial, setEstadoHistorial] = useState('abierta');
  const cargarHistorial = useCallback(() => inventarioApi.alertas({ estado: estadoHistorial }), [estadoHistorial]);
  const historial = useListado(cargarHistorial);
  const [revision, setRevision] = useState(null);
  const [revisando, setRevisando] = useState(false);
  const avisar = useAvisos();

  const filas = (verTodos ? reorden.datos : reorden.datos.filter((f) => f.estado !== 'ok')).map((f) => ({ ...f, id: f.material_id }));

  async function revisar() {
    setRevisando(true);
    try {
      setRevision(await inventarioApi.revisionDiaria());
      reorden.recargar();
      historial.recargar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setRevisando(false);
    }
  }

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Alertas de reorden</h1>
          <p className="texto-suave">
            Punto de reorden = demanda promedio × tiempo de entrega + stock de seguridad. Las alertas se abren y cierran solas con cada
            movimiento, y una revisión automática corre cada mañana.
          </p>
        </div>
        <button type="button" className="btn btn-primario" onClick={revisar} disabled={revisando}>
          {revisando ? 'Revisando…' : 'Ejecutar revisión diaria'}
        </button>
      </header>

      {!reorden.error && <TarjetasMetricas metricas={metricasReorden(reorden.datos)} />}

      <div className="tarjeta">
        <div className="barra-herramientas">
          <h2 className="tarjeta-titulo" style={{ padding: 0 }}>
            Qué pedir hoy, por prioridad
          </h2>
          <div className="filtros" role="group" aria-label="Materiales a mostrar">
            <button type="button" className={`filtro ${!verTodos ? 'filtro-activo' : ''}`} aria-pressed={!verTodos} onClick={() => setVerTodos(false)}>
              Solo por reponer
            </button>
            <button type="button" className={`filtro ${verTodos ? 'filtro-activo' : ''}`} aria-pressed={verTodos} onClick={() => setVerTodos(true)}>
              Todos los materiales
            </button>
          </div>
        </div>
        <TablaDatos
          columnas={columnasReorden}
          filas={filas}
          cargando={reorden.cargando}
          error={reorden.error}
          onReintentar={reorden.recargar}
          vacio="Ningún material está en su punto de reorden."
        />
      </div>

      <div className="tarjeta">
        <div className="barra-herramientas">
          <h2 className="tarjeta-titulo" style={{ padding: 0 }}>
            Historial de alertas
          </h2>
          <div className="filtros" role="group" aria-label="Filtrar alertas">
            {[
              ['abierta', 'Abiertas'],
              ['cerrada', 'Cerradas'],
              ['', 'Todas'],
            ].map(([valor, texto]) => (
              <button
                key={texto}
                type="button"
                className={`filtro ${estadoHistorial === valor ? 'filtro-activo' : ''}`}
                aria-pressed={estadoHistorial === valor}
                onClick={() => setEstadoHistorial(valor)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
        <TablaDatos
          columnas={columnasHistorial}
          filas={historial.datos}
          cargando={historial.cargando}
          error={historial.error}
          onReintentar={historial.recargar}
          vacio="No hay alertas con ese filtro."
        />
      </div>

      {revision && (
        <Modal titulo="Resultado de la revisión diaria" ancho="lg" onCerrar={() => setRevision(null)}>
          <div className="modal-cuerpo">
            <p className="texto-suave">
              {revision.aviso_enviado
                ? 'El resumen también se envió al canal configurado (webhook).'
                : 'No hay webhook configurado (ALERTAS_WEBHOOK_URL): el resumen queda aquí y en la consola del servidor.'}
            </p>
            <pre className="resumen-texto">{revision.resumen}</pre>
          </div>
          <footer className="modal-pie">
            <a className="btn" href="#/duplicados" onClick={() => setRevision(null)}>
              Ver duplicados
            </a>
            <button type="button" className="btn btn-primario" onClick={() => setRevision(null)}>
              Cerrar
            </button>
          </footer>
        </Modal>
      )}
    </section>
  );
}
