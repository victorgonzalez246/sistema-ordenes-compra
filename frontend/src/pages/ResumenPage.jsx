import { useCallback } from 'react';
import { useListado } from '../hooks/useListado';
import EstadoOrden from '../components/EstadoOrden';
import Insignia from '../components/Insignia';
import TarjetasMetricas, { EstadoMetrica } from '../components/TarjetasMetricas';
import TarjetaGrafico from '../components/graficos/TarjetaGrafico';
import BarrasHorizontales from '../components/graficos/BarrasHorizontales';
import Columnas from '../components/graficos/Columnas';
import BarraSegmentada from '../components/graficos/BarraSegmentada';
import {
  departamentosApi,
  existenciasApi,
  facturasApi,
  ordenesApi,
  pagosApi,
  proveedoresApi,
  requisicionesApi,
} from '../services/recursos';
import { diasHasta, dinero, dineroCorto, entero, fecha, porcentaje, sumar } from '../utils/formato';

// Colores categóricos en orden fijo (validados para daltonismo)
const SERIE = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)', 'var(--serie-4)'];

// Cada estado tiene siempre el mismo color, aunque no tenga órdenes
const ESTADOS_GRAFICO = [
  { estado: 'aprobada', etiqueta: 'Aprobadas', color: SERIE[0] },
  { estado: 'pendiente', etiqueta: 'Pendientes', color: SERIE[1] },
  { estado: 'recibida', etiqueta: 'Recibidas', color: SERIE[2] },
  { estado: 'anulada', etiqueta: 'Anuladas', color: SERIE[3], textoOscuro: true },
];

const comprometida = (o) => o.estado === 'aprobada' || o.estado === 'recibida';
const saldo = (f) => Number(f.monto) - Number(f.pagado);

// Últimos 6 meses, terminando en el actual: [{ clave: '2026-11', etiqueta: 'nov' }]
function ultimosMeses(cantidad = 6) {
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (cantidad - 1 - i), 1);
    return {
      clave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      etiqueta: d.toLocaleDateString('es-CR', { month: 'short' }).replace('.', ''),
    };
  });
}

function calcular({ ordenes, departamentos, proveedores, facturas, pagos, existencias, requisiciones }) {
  const comprometidas = ordenes.filter(comprometida);
  const pendientes = ordenes.filter((o) => o.estado === 'pendiente');
  const presupuestoTotal = sumar(departamentos, 'presupuesto');
  const gasto = sumar(comprometidas, 'total');

  const porPagar = facturas.filter((f) => f.estado === 'pendiente');
  const vencidas = porPagar.filter((f) => diasHasta(f.fecha_vencimiento) < 0);
  const bajoMinimo = existencias.filter((e) => e.cantidad < e.minimo);
  const reqPendientes = requisiciones.filter((r) => r.estado === 'pendiente');

  const porDepartamento = departamentos.map((d) => {
    const propias = ordenes.filter((o) => o.departamento_id === d.id);
    const valores = {
      comprometido: sumar(propias.filter(comprometida), 'total'),
      tramite: sumar(propias.filter((o) => o.estado === 'pendiente'), 'total'),
    };
    const presupuesto = Number(d.presupuesto) || 0;
    const uso = presupuesto > 0 ? (valores.comprometido / presupuesto) * 100 : null;
    return { etiqueta: d.nombre, centro: d.centro_costo, presupuesto, uso, valores, nota: uso === null ? 'sin presupuesto' : `${porcentaje(uso)} del presupuesto` };
  });

  const porProveedor = proveedores
    .map((p) => ({
      etiqueta: p.razon_social,
      valores: { monto: sumar(ordenes.filter((o) => o.proveedor_id === p.id && o.estado !== 'anulada'), 'total') },
    }))
    .filter((p) => p.valores.monto > 0)
    .sort((a, b) => b.valores.monto - a.valores.monto)
    .slice(0, 5);

  const porEstado = ESTADOS_GRAFICO.map((e) => {
    const lista = ordenes.filter((o) => o.estado === e.estado);
    return { ...e, valor: sumar(lista, 'total'), cantidad: lista.length };
  });

  const tramos = [
    { etiqueta: 'Vencidas', cumple: (d) => d < 0 },
    { etiqueta: '0 a 30 días', cumple: (d) => d >= 0 && d <= 30 },
    { etiqueta: '31 a 60 días', cumple: (d) => d > 30 && d <= 60 },
    { etiqueta: 'Más de 60', cumple: (d) => d > 60 },
  ].map((t) => {
    const lista = porPagar.filter((f) => t.cumple(diasHasta(f.fecha_vencimiento)));
    return { etiqueta: t.etiqueta, valor: lista.reduce((s, f) => s + saldo(f), 0), detalle: `${lista.length} factura(s)` };
  });

  const pagosPorMes = ultimosMeses().map((m) => {
    const lista = pagos.filter((p) => p.fecha.startsWith(m.clave));
    return { etiqueta: m.etiqueta, valor: sumar(lista, 'monto'), detalle: `${lista.length} pago(s)` };
  });

  const proximas = [...porPagar].sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)).slice(0, 4);

  return {
    gasto, presupuestoTotal, comprometidas, pendientes, porPagar, vencidas, bajoMinimo, reqPendientes,
    existencias, proveedores, porDepartamento, porProveedor, porEstado, tramos, pagosPorMes, proximas,
  };
}

export default function ResumenPage() {
  const cargar = useCallback(async () => {
    const [ordenes, departamentos, proveedores, facturas, pagos, existencias, requisiciones] = await Promise.all([
      ordenesApi.listar(),
      departamentosApi.listar(),
      proveedoresApi.listar(),
      facturasApi.listar(),
      pagosApi.listar(),
      existenciasApi.listar(),
      requisicionesApi.listar(),
    ]);
    return [{ ordenes, departamentos, proveedores, facturas, pagos, existencias, requisiciones }];
  }, []);
  const { datos, cargando, error, recargar } = useListado(cargar);

  if (error || (cargando && !datos.length)) {
    return (
      <section className="pagina">
        <h1>Resumen</h1>
        <div className={`tarjeta estado-tabla ${error ? 'estado-error' : ''}`}>
          {error ? (
            <>
              <p>{error}</p>
              <button type="button" className="btn" onClick={recargar}>Reintentar</button>
            </>
          ) : (
            'Cargando…'
          )}
        </div>
      </section>
    );
  }

  const r = calcular(datos[0]);
  const usoTotal = r.presupuestoTotal > 0 ? (r.gasto / r.presupuestoTotal) * 100 : 0;

  const metricas = [
    {
      titulo: 'Cuentas por pagar',
      valor: dineroCorto(r.porPagar.reduce((s, f) => s + saldo(f), 0)),
      detalle: `${r.porPagar.length} factura(s) con saldo`,
      estado: r.vencidas.length
        ? { tono: 'critico', texto: `${r.vencidas.length} vencida(s)` }
        : { tono: 'bien', texto: 'Ninguna vencida' },
    },
    {
      titulo: 'Órdenes por aprobar',
      valor: entero(r.pendientes.length),
      detalle: dinero(sumar(r.pendientes, 'total')),
    },
    {
      titulo: 'Requisiciones pendientes',
      valor: entero(r.reqPendientes.length),
      detalle: `${dineroCorto(sumar(r.reqPendientes, 'monto_estimado'))} estimados`,
    },
    {
      titulo: 'Productos bajo el mínimo',
      valor: entero(r.bajoMinimo.length),
      detalle: `de ${r.existencias.length} existencias`,
      estado: r.bajoMinimo.length ? { tono: 'aviso', texto: 'Hay que reponer' } : { tono: 'bien', texto: 'Todo en orden' },
    },
    {
      titulo: 'Pagado este mes',
      valor: dineroCorto(r.pagosPorMes[r.pagosPorMes.length - 1].valor),
      detalle: r.pagosPorMes[r.pagosPorMes.length - 1].detalle,
    },
    {
      titulo: 'Proveedores activos',
      valor: entero(r.proveedores.filter((p) => p.activo).length),
      detalle: `de ${r.proveedores.length} registrados`,
    },
  ];

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Resumen</h1>
          <p className="texto-suave">Estado de las compras, el presupuesto, el inventario y las cuentas por pagar.</p>
        </div>
      </header>

      <div className="resumen-portada">
        <article className="tarjeta cifra-principal">
          <span className="metrica-titulo">Gasto comprometido</span>
          <span className="cifra-principal-valor">{dinero(r.gasto)}</span>
          <span className="metrica-detalle">
            {porcentaje(usoTotal)} del presupuesto anual ({dineroCorto(r.presupuestoTotal)}) · {r.comprometidas.length} orden(es) aprobadas o recibidas
          </span>
          <div className="medidor-grande" role="img" aria-label={`${porcentaje(usoTotal)} del presupuesto usado`}>
            <div style={{ width: `${Math.min(usoTotal, 100)}%` }} />
          </div>
        </article>
        <TarjetasMetricas metricas={metricas} />
      </div>

      <div className="rejilla-graficos">
        <TarjetaGrafico
          titulo="Gasto por departamento"
          subtitulo="Órdenes aprobadas o recibidas y órdenes pendientes de aprobar"
          leyenda={[
            { color: SERIE[0], texto: 'Comprometido' },
            { color: SERIE[1], texto: 'En trámite' },
          ]}
          tabla={{
            columnas: ['Departamento', 'Presupuesto', 'Comprometido', 'En trámite', 'Uso'],
            derecha: [1, 2, 3, 4],
            filas: r.porDepartamento.map((d) => [
              `${d.etiqueta} · ${d.centro}`,
              dinero(d.presupuesto),
              dinero(d.valores.comprometido),
              dinero(d.valores.tramite),
              d.uso === null ? '—' : porcentaje(d.uso),
            ]),
          }}
        >
          <BarrasHorizontales
            series={[
              { clave: 'comprometido', nombre: 'Comprometido', color: SERIE[0] },
              { clave: 'tramite', nombre: 'En trámite', color: SERIE[1] },
            ]}
            datos={r.porDepartamento}
            formato={dineroCorto}
          />
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Órdenes por estado"
          subtitulo="Monto total de las órdenes en cada estado"
          leyenda={ESTADOS_GRAFICO.map((e) => ({ color: e.color, texto: e.etiqueta }))}
          tabla={{
            columnas: ['Estado', 'Órdenes', 'Monto'],
            derecha: [1, 2],
            filas: r.porEstado.map((e) => [e.etiqueta, entero(e.cantidad), dinero(e.valor)]),
          }}
        >
          <BarraSegmentada datos={r.porEstado} formato={dinero} />
          <ul className="desglose">
            {r.porEstado.map((e) => (
              <li key={e.estado}>
                <span className="leyenda-muestra" style={{ background: e.color }} />
                <span>{e.etiqueta}</span>
                <strong>{entero(e.cantidad)}</strong>
              </li>
            ))}
          </ul>
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Cuentas por pagar por vencimiento"
          subtitulo="Saldo pendiente de las facturas según los días que faltan para vencer"
          tabla={{
            columnas: ['Tramo', 'Facturas', 'Saldo'],
            derecha: [1, 2],
            filas: r.tramos.map((t) => [t.etiqueta, t.detalle, dinero(t.valor)]),
          }}
        >
          <Columnas datos={r.tramos} formato={dinero} formatoEje={dineroCorto} nombre="Saldo" />
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Pagos a proveedores"
          subtitulo="Monto pagado en los últimos 6 meses"
          tabla={{
            columnas: ['Mes', 'Pagos', 'Monto'],
            derecha: [1, 2],
            filas: r.pagosPorMes.map((m) => [m.etiqueta, m.detalle, dinero(m.valor)]),
          }}
        >
          <Columnas datos={r.pagosPorMes} formato={dinero} formatoEje={dineroCorto} nombre="Pagado" />
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Compras por proveedor"
          subtitulo="Monto de las órdenes no anuladas (los 5 principales)"
          tabla={{
            columnas: ['Proveedor', 'Monto'],
            derecha: [1],
            filas: r.porProveedor.map((p) => [p.etiqueta, dinero(p.valores.monto)]),
          }}
        >
          <BarrasHorizontales
            series={[{ clave: 'monto', nombre: 'Compras', color: SERIE[0] }]}
            datos={r.porProveedor}
            formato={dineroCorto}
          />
        </TarjetaGrafico>

        <article className="tarjeta grafico">
          <header className="grafico-cabecera">
            <div>
              <h2>Existencias bajo el mínimo</h2>
              <p className="texto-suave">Productos que hay que reponer</p>
            </div>
          </header>
          {r.bajoMinimo.length === 0 ? (
            <p className="estado-tabla">Todas las existencias están sobre su mínimo.</p>
          ) : (
            <ul className="lista-simple">
              {r.bajoMinimo.map((e) => {
                const avance = Math.min((e.cantidad / e.minimo) * 100, 100);
                return (
                  <li key={e.id}>
                    <div>
                      <strong>{e.producto?.nombre}</strong>
                      <div className="texto-suave">{e.bodega?.nombre}</div>
                    </div>
                    <div className="existencia-medidor">
                      <span>
                        {entero(e.cantidad)} de {entero(e.minimo)} {e.producto?.unidad}
                      </span>
                      <div className={`medidor-estado ${avance < 50 ? 'medidor-critico' : 'medidor-aviso'}`}>
                        <div style={{ width: `${avance}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <a className="enlace-mas" href="#/existencias">Ver existencias →</a>
        </article>
      </div>

      <div className="rejilla-graficos">
        <article className="tarjeta grafico">
          <header className="grafico-cabecera">
            <div>
              <h2>Órdenes pendientes de aprobación</h2>
            </div>
          </header>
          {r.pendientes.length === 0 ? (
            <p className="estado-tabla">No hay órdenes pendientes.</p>
          ) : (
            <ul className="lista-simple">
              {r.pendientes.map((o) => (
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
        </article>

        <article className="tarjeta grafico">
          <header className="grafico-cabecera">
            <div>
              <h2>Próximos vencimientos</h2>
            </div>
          </header>
          {r.proximas.length === 0 ? (
            <p className="estado-tabla">No hay facturas con saldo pendiente.</p>
          ) : (
            <ul className="lista-simple">
              {r.proximas.map((f) => {
                const dias = diasHasta(f.fecha_vencimiento);
                return (
                  <li key={f.id}>
                    <div>
                      <strong>{f.numero}</strong> · {f.orden?.proveedor?.razon_social}
                      <div className="texto-suave">Vence el {fecha(f.fecha_vencimiento)}</div>
                    </div>
                    <div className="derecha">
                      {dias < 0 ? (
                        <EstadoMetrica tono="critico" texto={`Vencida hace ${-dias} día(s)`} />
                      ) : dias <= 7 ? (
                        <EstadoMetrica tono="aviso" texto={`En ${dias} día(s)`} />
                      ) : (
                        <Insignia texto={`En ${dias} días`} clase="insignia-inactivo" />
                      )}
                      <div>{dinero(saldo(f))}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <a className="enlace-mas" href="#/facturas">Ver facturas →</a>
        </article>
      </div>
    </section>
  );
}
