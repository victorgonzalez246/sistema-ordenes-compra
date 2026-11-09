import { useCallback, useEffect, useState } from 'react';
import { useListado } from '../hooks/useListado';
import TablaDatos from '../components/TablaDatos';
import TarjetasMetricas from '../components/TarjetasMetricas';
import Insignia from '../components/Insignia';
import EstadoOrden from '../components/EstadoOrden';
import SelectRelacion from '../components/SelectRelacion';
import { fuentes } from '../services/fuentes';
import { inventarioApi, TIPOS_MOVIMIENTO, DOCUMENTOS, ESTADOS_REORDEN } from '../services/inventario';
import { dinero, entero, fecha } from '../utils/formato';

// Parámetros de la ruta: #/trazabilidad?producto=1&bodega=2
function leerParametros() {
  const qs = window.location.hash.split('?')[1] ?? '';
  const p = new URLSearchParams(qs);
  return { producto: p.get('producto') ?? '', bodega: p.get('bodega') ?? '' };
}

function escribirParametros({ producto, bodega }) {
  const qs = new URLSearchParams(Object.entries({ producto, bodega }).filter(([, v]) => v)).toString();
  window.history.replaceState(null, '', `#/trazabilidad${qs ? `?${qs}` : ''}`);
}

const columnasMovimientos = [
  { clave: 'fecha', titulo: 'Fecha', render: (m) => <span className="sin-corte">{fecha(m.fecha)}</span> },
  { clave: 'tipo', titulo: 'Tipo', render: (m) => <Insignia texto={TIPOS_MOVIMIENTO[m.tipo]} clase={`tipo-${m.tipo}`} /> },
  {
    clave: 'cambio',
    titulo: 'Cambio',
    alinear: 'derecha',
    render: (m) =>
      m.cambio === 0 ? (
        <span className="texto-suave" title="Un traslado no cambia el total de la empresa">±{entero(m.cantidad)}</span>
      ) : (
        <span className={m.cambio > 0 ? 'positivo' : 'negativo'}>
          {m.cambio > 0 ? '+' : '−'}
          {entero(Math.abs(m.cambio))}
        </span>
      ),
  },
  { clave: 'saldo', titulo: 'Saldo', alinear: 'derecha', render: (m) => <strong>{entero(m.saldo)}</strong> },
  {
    clave: 'ubicacion',
    titulo: 'Ubicación',
    render: (m) => (m.origen && m.destino ? `${m.origen} → ${m.destino}` : m.origen ? `Sale de ${m.origen}` : `Entra a ${m.destino}`),
  },
  {
    clave: 'documento',
    titulo: 'Documento / origen',
    render: (m) => (
      <>
        <strong className="sin-corte">{m.documento.numero}</strong>
        <div className="texto-suave">
          {m.origen_compra
            ? `${m.origen_compra.proveedor} · ${dinero(m.origen_compra.precio_unitario)} c/u`
            : DOCUMENTOS[m.documento.tipo]}
        </div>
      </>
    ),
  },
  { clave: 'usuario', titulo: 'Registró', render: (m) => m.usuario ?? '—' },
  { clave: 'observaciones', titulo: 'Observaciones', render: (m) => m.observaciones || '—' },
];

const columnasOrdenes = [
  { clave: 'orden', titulo: 'Orden', render: (o) => <span className="sin-corte"><strong>{o.orden}</strong> <EstadoOrden estado={o.estado} /></span> },
  { clave: 'proveedor', titulo: 'Proveedor', render: (o) => o.proveedor },
  { clave: 'pedida', titulo: 'Pedida', alinear: 'derecha', render: (o) => entero(o.pedida) },
  { clave: 'recibida', titulo: 'Recibida', alinear: 'derecha', render: (o) => entero(o.recibida) },
  {
    clave: 'pendiente',
    titulo: 'Pendiente',
    alinear: 'derecha',
    render: (o) => (o.pendiente ? <strong>{entero(o.pendiente)}</strong> : <span className="texto-suave">0</span>),
  },
];

export default function TrazabilidadPage() {
  const [seleccion, setSeleccion] = useState(leerParametros);
  useEffect(() => escribirParametros(seleccion), [seleccion]);

  const cargar = useCallback(async () => {
    if (!seleccion.producto) return [];
    const [traza, stock] = await Promise.all([
      inventarioApi.trazabilidad(seleccion.producto, seleccion.bodega),
      inventarioApi.stock(seleccion.producto),
    ]);
    return [{ traza, stock }];
  }, [seleccion]);
  const { datos, cargando, error, recargar } = useListado(cargar);
  const r = datos[0];

  const cambiar = (campo) => (e) => setSeleccion((s) => ({ ...s, [campo]: e.target.value }));
  const nombreBodega = r?.stock.por_bodega.find((b) => String(b.bodega_id) === String(seleccion.bodega))?.bodega;

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Trazabilidad de materiales</h1>
          <p className="texto-suave">
            Historial completo de un material: cada movimiento con su saldo, y de qué orden de compra y proveedor vino cada entrada.
          </p>
        </div>
      </header>

      <div className="tarjeta barra-herramientas">
        <div className="filtros-inventario" style={{ flex: 1 }}>
          <label className="campo">
            <span className="campo-etiqueta">Material</span>
            <SelectRelacion value={seleccion.producto} onChange={cambiar('producto')} fuente={fuentes.producto} />
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Bodega u obra (opcional)</span>
            <SelectRelacion value={seleccion.bodega} onChange={cambiar('bodega')} fuente={{ ...fuentes.bodega, filtro: null }} opcionVacia="Toda la empresa" />
          </label>
        </div>
      </div>

      {!seleccion.producto && <div className="tarjeta estado-tabla">Elige un material para ver su historial.</div>}
      {error && (
        <div className="tarjeta estado-tabla estado-error">
          <p>{error}</p>
          <button type="button" className="btn" onClick={recargar}>Reintentar</button>
        </div>
      )}
      {cargando && seleccion.producto && !r && <div className="tarjeta estado-tabla">Cargando…</div>}

      {r && (
        <>
          <TarjetasMetricas
            metricas={[
              {
                titulo: 'Stock total',
                valor: `${entero(r.stock.stock)} ${r.stock.material.unidad}`,
                detalle: r.stock.por_bodega.map((b) => `${b.bodega}: ${entero(b.cantidad)}`).join(' · ') || 'sin existencias',
              },
              {
                titulo: 'Punto de reorden',
                valor: r.stock.punto_reorden === null ? '—' : entero(r.stock.punto_reorden),
                detalle: r.stock.stock_seguridad === null ? 'faltan parámetros' : `stock de seguridad ${entero(r.stock.stock_seguridad)}`,
                estado:
                  r.stock.estado === 'ok'
                    ? { tono: 'bien', texto: ESTADOS_REORDEN.ok }
                    : r.stock.estado === 'sin_parametros'
                      ? undefined
                      : { tono: r.stock.estado === 'urgente' ? 'critico' : 'aviso', texto: `${ESTADOS_REORDEN[r.stock.estado]}: pedir ${entero(r.stock.cantidad_sugerida)}` },
              },
              {
                titulo: seleccion.bodega ? `Saldo en ${nombreBodega ?? 'la bodega'}` : 'Movimientos',
                valor: seleccion.bodega ? entero(r.traza.saldo_final) : entero(r.traza.movimientos.length),
                detalle: seleccion.bodega ? `${r.traza.movimientos.length} movimiento(s)` : 'desde el inventario inicial',
              },
              {
                titulo: 'Días de cobertura',
                valor: r.stock.dias_cobertura === null ? '—' : r.stock.dias_cobertura.toLocaleString('es-CR'),
                detalle: r.stock.parametros.tiempo_entrega ? `el proveedor tarda ${r.stock.parametros.tiempo_entrega} día(s)` : '',
              },
            ]}
          />

          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Entradas por orden de compra</h2>
            <TablaDatos
              columnas={columnasOrdenes}
              filas={r.traza.entradas_por_orden.map((o) => ({ ...o, id: o.orden_id }))}
              cargando={false}
              vacio="Este material no ha entrado por ninguna orden de compra."
            />
          </div>

          <div className="tarjeta">
            <h2 className="tarjeta-titulo">
              Historial de movimientos {seleccion.bodega && nombreBodega ? `en ${nombreBodega}` : '(toda la empresa)'}
            </h2>
            <TablaDatos columnas={columnasMovimientos} filas={r.traza.movimientos} cargando={false} vacio="Sin movimientos." />
          </div>
        </>
      )}
    </section>
  );
}
