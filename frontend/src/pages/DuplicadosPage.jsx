import { useCallback, useState } from 'react';
import { useListado } from '../hooks/useListado';
import TarjetasMetricas from '../components/TarjetasMetricas';
import Insignia from '../components/Insignia';
import EstadoOrden from '../components/EstadoOrden';
import { inventarioApi } from '../services/inventario';
import { dinero, dineroCorto, entero, fecha } from '../utils/formato';

// useListado espera una lista; aquí se envuelve la respuesta completa en un arreglo de un elemento
const envolver = (r) => [r];

function TarjetaSospecha({ s }) {
  const orden = (o, rol) => (
    <div className="sospecha-orden">
      <small>{rol}</small>
      <strong>{o.numero}</strong> <EstadoOrden estado={o.estado} />
      <small>
        {fecha(o.fecha)} · {o.departamento}
      </small>
    </div>
  );

  return (
    <article className="tarjeta sospecha">
      <div className="sospecha-cabecera">
        <div>
          <Insignia texto={s.nivel === 'alta' ? 'Sospecha alta' : 'Sospecha media'} clase={s.nivel === 'alta' ? 'estado-urgente' : 'estado-reponer'} />{' '}
          <strong>{s.orden_original.proveedor}</strong>
        </div>
        <div className="derecha">
          <div className="texto-suave">Monto en riesgo</div>
          <div className="monto-riesgo">{dinero(s.monto_en_riesgo)}</div>
        </div>
      </div>

      <div className="sospecha-ordenes">
        {orden(s.orden_original, 'Orden original')}
        <span className="sospecha-vs" aria-hidden="true">≈</span>
        {orden(s.posible_duplicado, 'Posible duplicado')}
      </div>

      <p className="texto-suave" style={{ margin: '10px 0 6px' }}>{s.motivo}.</p>
      <ul className="lista-simple" style={{ padding: 0 }}>
        {s.coincidencias.map((c) => (
          <li key={c.producto_id} style={{ padding: '6px 0' }}>
            <span>{c.producto}</span>
            <span className="sin-corte">
              {entero(c.cantidad_original)} vs {entero(c.cantidad_posible_duplicado)}
              {c.diferencia_cantidad_pct > 0 ? ` (${c.diferencia_cantidad_pct} % de diferencia)` : ' (idéntica)'}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function DuplicadosPage() {
  const [regla, setRegla] = useState({ dias: '7', tolerancia: '10' });
  const [aplicada, setAplicada] = useState(regla);
  const cargar = useCallback(() => inventarioApi.duplicados(aplicada).then(envolver), [aplicada]);
  const { datos, cargando, error, recargar } = useListado(cargar);
  const r = datos[0];

  const altas = r ? r.sospechas.filter((s) => s.nivel === 'alta') : [];

  function aplicar(e) {
    e.preventDefault();
    setAplicada({ ...regla });
  }

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Posibles compras duplicadas</h1>
          <p className="texto-suave">
            Regla: mismo proveedor, mismo artículo, cantidad parecida y fechas cercanas. Las órdenes anuladas no cuentan. Revise cada caso
            antes de recibir o pagar la orden.
          </p>
        </div>
      </header>

      {r && (
        <TarjetasMetricas
          metricas={[
            { titulo: 'Órdenes revisadas', valor: entero(r.ordenes_revisadas), detalle: 'no anuladas' },
            {
              titulo: 'Sospechas',
              valor: entero(r.total_sospechas),
              detalle: `${altas.length} de nivel alto`,
              estado: r.total_sospechas ? { tono: 'critico', texto: 'Revisar antes de pagar' } : { tono: 'bien', texto: 'Sin duplicados' },
            },
            { titulo: 'Monto en riesgo', valor: dineroCorto(r.monto_en_riesgo), detalle: dinero(r.monto_en_riesgo) },
          ]}
        />
      )}

      <form className="tarjeta barra-herramientas" onSubmit={aplicar} style={{ alignItems: 'flex-end' }}>
        <div className="filtros-inventario">
          <label className="campo campo-corto">
            <span className="campo-etiqueta">Días entre órdenes</span>
            <input type="number" min="0" max="365" value={regla.dias} onChange={(e) => setRegla((x) => ({ ...x, dias: e.target.value }))} />
          </label>
          <label className="campo campo-corto">
            <span className="campo-etiqueta">Diferencia de cantidad (%)</span>
            <input type="number" min="0" max="100" value={regla.tolerancia} onChange={(e) => setRegla((x) => ({ ...x, tolerancia: e.target.value }))} />
          </label>
          <button type="submit" className="btn btn-primario">Aplicar regla</button>
        </div>
        {r && <span className="texto-suave">{r.regla.descripcion}</span>}
      </form>

      {error && (
        <div className="tarjeta estado-tabla estado-error">
          <p>{error}</p>
          <button type="button" className="btn" onClick={recargar}>Reintentar</button>
        </div>
      )}
      {cargando && !r && <div className="tarjeta estado-tabla">Cargando…</div>}
      {r && r.sospechas.length === 0 && <div className="tarjeta estado-tabla">No se encontraron posibles duplicados con esta regla.</div>}

      {r && r.sospechas.length > 0 && (
        <div className="sospechas">
          {r.sospechas.map((s) => (
            <TarjetaSospecha key={`${s.orden_original.id}-${s.posible_duplicado.id}`} s={s} />
          ))}
        </div>
      )}
    </section>
  );
}
