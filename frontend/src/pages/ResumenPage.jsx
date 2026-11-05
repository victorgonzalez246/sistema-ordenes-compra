import { useCallback } from 'react';
import { useListado } from '../hooks/useListado';
import EstadoOrden from '../components/EstadoOrden';
import { departamentosApi, ordenesApi, proveedoresApi } from '../services/recursos';
import { dinero, fecha } from '../utils/formato';

const porcentaje = (n) => n.toLocaleString('es-CR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sumar = (lista) => lista.reduce((s, o) => s + Number(o.total), 0);

export default function ResumenPage() {
  const cargar = useCallback(async () => {
    const [ordenes, departamentos, proveedores] = await Promise.all([
      ordenesApi.listar(),
      departamentosApi.listar(),
      proveedoresApi.listar(),
    ]);
    return [{ ordenes, departamentos, proveedores }];
  }, []);
  const { datos, cargando, error, recargar } = useListado(cargar);

  if (error) {
    return (
      <section className="pagina">
        <h1>Resumen</h1>
        <div className="tarjeta estado-tabla estado-error">
          <p>{error}</p>
          <button type="button" className="btn" onClick={recargar}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (cargando && !datos.length) {
    return (
      <section className="pagina">
        <h1>Resumen</h1>
        <div className="tarjeta estado-tabla">Cargando…</div>
      </section>
    );
  }

  const { ordenes, departamentos, proveedores } = datos[0];
  const pendientes = ordenes.filter((o) => o.estado === 'pendiente');
  const porRecibir = ordenes.filter((o) => o.estado === 'aprobada');
  // Gasto comprometido: órdenes aprobadas o ya recibidas
  const comprometidas = ordenes.filter((o) => o.estado === 'aprobada' || o.estado === 'recibida');

  const porDepartamento = departamentos.map((d) => {
    const propias = ordenes.filter((o) => o.departamento_id === d.id);
    const comprometido = sumar(propias.filter((o) => o.estado === 'aprobada' || o.estado === 'recibida'));
    const enTramite = sumar(propias.filter((o) => o.estado === 'pendiente'));
    const presupuesto = Number(d.presupuesto) || 0;
    const uso = presupuesto > 0 ? (comprometido / presupuesto) * 100 : null;
    return { ...d, comprometido, enTramite, uso };
  });

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Resumen</h1>
          <p className="texto-suave">Estado de las compras y gasto por departamento.</p>
        </div>
      </header>

      <div className="indicadores">
        <article className="indicador">
          <span className="indicador-titulo">Pendientes de aprobación</span>
          <span className="indicador-valor">{pendientes.length}</span>
          <span className="texto-suave">{dinero(sumar(pendientes))}</span>
        </article>
        <article className="indicador">
          <span className="indicador-titulo">Aprobadas por recibir</span>
          <span className="indicador-valor">{porRecibir.length}</span>
          <span className="texto-suave">{dinero(sumar(porRecibir))}</span>
        </article>
        <article className="indicador">
          <span className="indicador-titulo">Gasto comprometido</span>
          <span className="indicador-valor">{dinero(sumar(comprometidas))}</span>
          <span className="texto-suave">{comprometidas.length} orden(es) aprobadas o recibidas</span>
        </article>
        <article className="indicador">
          <span className="indicador-titulo">Proveedores activos</span>
          <span className="indicador-valor">{proveedores.filter((p) => p.activo).length}</span>
          <span className="texto-suave">de {proveedores.length} registrados</span>
        </article>
      </div>

      <div className="tarjeta">
        <h2 className="tarjeta-titulo">Gasto por departamento</h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Departamento</th>
                <th className="derecha">Presupuesto</th>
                <th className="derecha">Comprometido</th>
                <th className="derecha">En trámite</th>
                <th>Uso del presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {porDepartamento.map((d) => (
                <tr key={d.id}>
                  <td data-titulo="Departamento">
                    <strong>{d.nombre}</strong>
                    <span className="texto-suave"> · {d.centro_costo}</span>
                  </td>
                  <td data-titulo="Presupuesto" className="derecha">{dinero(d.presupuesto)}</td>
                  <td data-titulo="Comprometido" className="derecha">{dinero(d.comprometido)}</td>
                  <td data-titulo="En trámite" className="derecha">{dinero(d.enTramite)}</td>
                  <td data-titulo="Uso del presupuesto">
                    {d.uso === null ? (
                      <span className="texto-suave">Sin presupuesto</span>
                    ) : (
                      <div className="medidor" title={`${porcentaje(d.uso)} %`}>
                        <div className="medidor-barra">
                          <div
                            className={`medidor-relleno ${d.uso > 100 ? 'medidor-excedido' : ''}`}
                            style={{ width: `${Math.min(d.uso, 100)}%` }}
                          />
                        </div>
                        <span>{porcentaje(d.uso)} %</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tarjeta">
        <h2 className="tarjeta-titulo">Órdenes pendientes de aprobación</h2>
        {pendientes.length === 0 ? (
          <p className="estado-tabla">No hay órdenes pendientes.</p>
        ) : (
          <ul className="lista-simple">
            {pendientes.map((o) => (
              <li key={o.id}>
                <div>
                  <strong>{o.numero}</strong> · {o.departamento?.nombre}
                  <div className="texto-suave">
                    {o.proveedor?.razon_social} · {fecha(o.fecha)}
                  </div>
                </div>
                <div className="derecha">
                  <EstadoOrden estado={o.estado} />
                  <div>{dinero(o.total)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <a className="enlace-mas" href="#/ordenes">Ver todas las órdenes →</a>
      </div>
    </section>
  );
}
