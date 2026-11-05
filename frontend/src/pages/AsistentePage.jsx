import { useCallback, useEffect, useRef, useState } from 'react';
import MapaAgentes, { AGENTES_INFO } from '../components/MapaAgentes';
import TextoMarkdown from '../components/TextoMarkdown';
import { useListado } from '../hooks/useListado';
import { estadoAsistente, preguntarAsistente } from '../services/asistente';

const SUGERENCIAS = [
  '¿Qué productos debo reponer y en qué bodega?',
  '¿Cuánto les debemos a los proveedores y qué vence pronto?',
  '¿Qué departamento lleva más gasto frente a su presupuesto?',
  'Compara las cotizaciones del teclado y ratón inalámbricos',
];

const ESTADO_INICIAL = () =>
  Object.fromEntries(Object.keys(AGENTES_INFO).map((clave) => [clave, { fase: 'inactivo', etiqueta: '' }]));

const NOMBRE_HERRAMIENTA = {
  listar_ordenes: 'órdenes', listar_requisiciones: 'requisiciones', listar_cotizaciones: 'cotizaciones',
  listar_proveedores: 'proveedores', listar_existencias: 'existencias', listar_bodegas: 'bodegas',
  listar_recepciones: 'recepciones', listar_facturas: 'facturas', listar_pagos: 'pagos',
  gasto_por_departamento: 'gasto por departamento',
};

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const hora = (t) => new Date(t).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function AsistentePage() {
  const cargarEstado = useCallback(async () => [await estadoAsistente()], []);
  const { datos: estadoDatos, cargando: cargandoEstado, error: errorEstado } = useListado(cargarEstado);
  const configuracion = estadoDatos[0];

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [estados, setEstados] = useState(ESTADO_INICIAL);
  const [cerebro, setCerebro] = useState('inactivo');
  const [viajes, setViajes] = useState([]);
  const [mysqlActivo, setMysqlActivo] = useState(0);
  const [actividad, setActividad] = useState([]);
  const abortar = useRef(null);
  const finChat = useRef(null);
  const idViaje = useRef(0);

  useEffect(() => {
    finChat.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes]);

  useEffect(() => () => abortar.current?.abort(), []);

  const fase = (agente, cambios) => setEstados((e) => ({ ...e, [agente]: { ...e[agente], ...cambios } }));
  const registrar = (t, agente, textoActividad) =>
    setActividad((a) => [{ id: `${t}-${a.length}`, t, agente, texto: textoActividad }, ...a].slice(0, 60));

  function viajar(de, a, color) {
    if (sinMovimiento()) return;
    const id = ++idViaje.current;
    setViajes((v) => [...v, { id, de, a, color }]);
    setTimeout(() => setViajes((v) => v.filter((x) => x.id !== id)), 1200);
  }

  // Traduce cada evento del back end en movimiento del mapa y en una línea de actividad
  function alEvento(e) {
    const info = AGENTES_INFO[e.agente];
    switch (e.tipo) {
      case 'cerebro_piensa':
        setCerebro('pensando');
        registrar(e.t, null, 'El cerebro analiza la pregunta');
        break;
      case 'delegar':
        viajar('cerebro', e.agente, info.color);
        fase(e.agente, { fase: 'trabajando', etiqueta: 'Recibió una tarea' });
        registrar(e.t, e.agente, `Recibe la tarea: “${e.tarea}”`);
        break;
      case 'herramienta':
        viajar(e.agente, 'mysql', info.color);
        setMysqlActivo((n) => n + 1);
        fase(e.agente, { fase: 'consultando', etiqueta: `Consulta ${NOMBRE_HERRAMIENTA[e.herramienta] || e.herramienta}` });
        registrar(e.t, e.agente, `Consulta MySQL: ${NOMBRE_HERRAMIENTA[e.herramienta] || e.herramienta}`);
        break;
      case 'herramienta_lista':
        viajar('mysql', e.agente, info.color);
        setMysqlActivo((n) => Math.max(n - 1, 0));
        fase(e.agente, { fase: 'trabajando', etiqueta: `${e.filas} registro(s) leídos` });
        registrar(e.t, e.agente, `Recibe ${e.filas} registro(s)`);
        break;
      case 'agente_responde':
        viajar(e.agente, 'cerebro', info.color);
        fase(e.agente, { fase: 'entregando', etiqueta: 'Entrega su informe' });
        setTimeout(() => fase(e.agente, { fase: 'listo', etiqueta: 'Listo' }), 1100);
        registrar(e.t, e.agente, 'Entrega su informe al cerebro');
        break;
      case 'agente_error':
        fase(e.agente, { fase: 'error', etiqueta: 'Falló' });
        registrar(e.t, e.agente, `Error: ${e.mensaje}`);
        break;
      case 'respuesta':
        setCerebro('inactivo');
        setMensajes((m) => [...m, { rol: 'asistente', texto: e.texto }]);
        registrar(e.t, null, 'El cerebro redacta la respuesta final');
        break;
      case 'error':
        setCerebro('inactivo');
        setMensajes((m) => [...m, { rol: 'error', texto: e.mensaje }]);
        registrar(e.t, null, `Error: ${e.mensaje}`);
        break;
      default:
        break;
    }
  }

  async function enviar(pregunta) {
    const limpia = pregunta.trim();
    if (!limpia || trabajando) return;
    const historial = mensajes.filter((m) => m.rol !== 'error').slice(-10).map(({ rol, texto: t }) => ({ rol, texto: t }));
    setMensajes((m) => [...m, { rol: 'usuario', texto: limpia }]);
    setTexto('');
    setEstados(ESTADO_INICIAL());
    setActividad([]);
    setTrabajando(true);
    abortar.current = new AbortController();
    try {
      await preguntarAsistente({ pregunta: limpia, historial, alEvento, senal: abortar.current.signal });
    } catch (e) {
      if (e.name !== 'AbortError') setMensajes((m) => [...m, { rol: 'error', texto: e.message }]);
      else setMensajes((m) => [...m, { rol: 'error', texto: 'Detuviste la consulta.' }]);
    } finally {
      setTrabajando(false);
      setCerebro('inactivo');
      setMysqlActivo(0);
    }
  }

  const listo = configuracion?.configurado;

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Asistente con IA</h1>
          <p className="texto-suave">
            Un cerebro coordina a tres agentes especialistas que consultan la base de datos en vivo. Solo consultan: no crean, modifican ni borran datos.
          </p>
        </div>
      </header>

      {!cargandoEstado && (errorEstado || !listo) && (
        <div className="tarjeta asistente-config">
          <h2>Falta configurar la clave de la API</h2>
          <p className="texto-suave">{errorEstado || 'El asistente usa Claude, el modelo de Anthropic, y necesita una clave de API para funcionar.'}</p>
          <ol>
            <li>Crea una clave en <strong>platform.claude.com</strong> (Settings → API keys).</li>
            <li>Agrégala en <code>backend/.env</code> como <code>ANTHROPIC_API_KEY=tu_clave</code>.</li>
            <li>Reinicia el servidor del back end (<code>npm run dev</code>).</li>
          </ol>
        </div>
      )}

      <div className="asistente">
        <article className="tarjeta asistente-mapa">
          <header className="grafico-cabecera">
            <div>
              <h2>Mapa de agentes</h2>
              <p className="texto-suave">{configuracion ? `Modelo: ${configuracion.modelo}` : 'Cerebro, agentes y base de datos'}</p>
            </div>
            <span className={`asistente-estado ${trabajando ? 'activo' : ''}`}>{trabajando ? 'Trabajando…' : 'En espera'}</span>
          </header>
          <MapaAgentes estados={estados} cerebro={cerebro} viajes={viajes} mysqlActivo={mysqlActivo > 0} />
          <div className="actividad">
            <h3>Actividad</h3>
            {actividad.length === 0 ? (
              <p className="texto-suave">Haz una pregunta para ver a los agentes trabajar.</p>
            ) : (
              <ol>
                {actividad.map((a) => (
                  <li key={a.id}>
                    <time>{hora(a.t)}</time>
                    <span className="actividad-quien" style={{ '--color': a.agente ? AGENTES_INFO[a.agente].color : '#a78bfa' }}>
                      {a.agente ? AGENTES_INFO[a.agente].nombre : 'Cerebro'}
                    </span>
                    <span>{a.texto}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </article>

        <article className="tarjeta asistente-chat">
          <div className="chat-mensajes" aria-live="polite">
            {mensajes.length === 0 && (
              <div className="chat-vacio">
                <p>Pregunta lo que quieras sobre las compras, el inventario o las cuentas por pagar.</p>
                <div className="chat-sugerencias">
                  {SUGERENCIAS.map((s) => (
                    <button key={s} type="button" className="filtro" onClick={() => enviar(s)} disabled={!listo || trabajando}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`chat-burbuja chat-${m.rol}`}>
                {m.rol === 'asistente' ? <TextoMarkdown texto={m.texto} /> : m.texto}
              </div>
            ))}
            {trabajando && <div className="chat-burbuja chat-asistente chat-escribiendo">Los agentes están investigando…</div>}
            <div ref={finChat} />
          </div>
          <form
            className="chat-entrada"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar(texto);
                }
              }}
              placeholder={listo ? 'Escribe tu pregunta… (Enter para enviar)' : 'Configura la clave de la API para usar el asistente'}
              maxLength={1000}
              rows={2}
              disabled={!listo}
              aria-label="Pregunta para el asistente"
            />
            {trabajando ? (
              <button type="button" className="btn" onClick={() => abortar.current?.abort()}>Detener</button>
            ) : (
              <button type="submit" className="btn btn-primario" disabled={!listo || !texto.trim()}>Enviar</button>
            )}
          </form>
        </article>
      </div>
    </section>
  );
}
