import { useCallback, useEffect, useMemo, useState } from 'react';
import TablaDatos from '../components/TablaDatos';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import OrdenForm from '../components/OrdenForm';
import EstadoOrden, { ESTADOS, NOMBRE_ESTADO } from '../components/EstadoOrden';
import { useAvisos } from '../components/Avisos';
import { useListado } from '../hooks/useListado';
import { departamentosApi, ordenesApi, productosApi, proveedoresApi } from '../services/recursos';
import TarjetasMetricas from '../components/TarjetasMetricas';
import { dinero, dineroCorto, entero, fecha, sumar } from '../utils/formato';

// Indicadores sobre todas las órdenes, sin importar el filtro de estado
function metricasOrdenes(todas) {
  const de = (estado) => todas.filter((o) => o.estado === estado);
  const pendientes = de('pendiente');
  const aprobadas = de('aprobada');
  const comprometidas = [...aprobadas, ...de('recibida')];
  const activas = todas.filter((o) => o.estado !== 'anulada');
  return [
    { titulo: 'Órdenes', valor: entero(todas.length), detalle: `${entero(de('anulada').length)} anulada(s)` },
    {
      titulo: 'Por aprobar',
      valor: entero(pendientes.length),
      detalle: dinero(sumar(pendientes, 'total')),
      estado: pendientes.length ? { tono: 'aviso', texto: 'Esperan aprobación' } : { tono: 'bien', texto: 'Nada pendiente' },
    },
    { titulo: 'Aprobadas por recibir', valor: entero(aprobadas.length), detalle: dinero(sumar(aprobadas, 'total')) },
    { titulo: 'Gasto comprometido', valor: dineroCorto(sumar(comprometidas, 'total')), detalle: `${entero(comprometidas.length)} orden(es) aprobadas o recibidas` },
    { titulo: 'Ticket promedio', valor: dineroCorto(activas.length ? sumar(activas, 'total') / activas.length : 0), detalle: 'por orden no anulada' },
  ];
}

const columnas = [
  { clave: 'numero', titulo: 'Número', render: (o) => <strong className="sin-corte">{o.numero}</strong> },
  { clave: 'fecha', titulo: 'Fecha', render: (o) => <span className="sin-corte">{fecha(o.fecha)}</span> },
  { clave: 'departamento', titulo: 'Departamento', render: (o) => o.departamento?.nombre },
  { clave: 'proveedor', titulo: 'Proveedor', render: (o) => o.proveedor?.razon_social },
  { clave: 'estado', titulo: 'Estado', render: (o) => <EstadoOrden estado={o.estado} /> },
  { clave: 'total', titulo: 'Total', alinear: 'derecha', render: (o) => dinero(o.total) },
];

// Siguiente número con el formato OC-AAAA-0001
function siguienteNumero(ordenes) {
  const anio = new Date().getFullYear();
  const prefijo = `OC-${anio}-`;
  const mayor = ordenes
    .filter((o) => o.numero.startsWith(prefijo))
    .reduce((max, o) => Math.max(max, Number(o.numero.slice(prefijo.length)) || 0), 0);
  return `${prefijo}${String(mayor + 1).padStart(4, '0')}`;
}

const eliminable = (o) => o.estado === 'pendiente' || o.estado === 'anulada';

export default function OrdenesPage() {
  const [filtroEstado, setFiltroEstado] = useState('');
  const cargarOrdenes = useCallback(() => ordenesApi.listar({ estado: filtroEstado }), [filtroEstado]);
  const { datos: ordenes, cargando, error, recargar } = useListado(cargarOrdenes);

  const [catalogos, setCatalogos] = useState(null);
  const [todas, setTodas] = useState([]);
  const [abierta, setAbierta] = useState(null); // null · { nueva: true } · orden completa
  const [eliminando, setEliminando] = useState(null);
  const avisar = useAvisos();

  async function cargarCatalogos() {
    const [departamentos, proveedores, productos, todasLasOrdenes] = await Promise.all([
      departamentosApi.listar(),
      proveedoresApi.listar(),
      productosApi.listar(),
      ordenesApi.listar(),
    ]);
    setCatalogos({ departamentos, proveedores, productos });
    setTodas(todasLasOrdenes);
  }

  useEffect(() => {
    cargarCatalogos().catch((e) => avisar(e.message, 'error'));
    // Solo al montar la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function abrirNueva() {
    try {
      await cargarCatalogos();
      setAbierta({ nueva: true });
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  async function abrir(fila) {
    try {
      const [orden] = await Promise.all([ordenesApi.obtener(fila.id), cargarCatalogos()]);
      setAbierta(orden);
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  async function guardar(datos) {
    if (abierta.nueva) {
      const creada = await ordenesApi.crear(datos);
      avisar(`Orden ${creada.numero} creada`);
    } else {
      await ordenesApi.actualizar(abierta.id, datos);
      avisar(`Orden ${abierta.numero} actualizada`);
    }
    setAbierta(null);
    recargarTodo();
  }

  // Recarga el listado filtrado y las métricas
  function recargarTodo() {
    recargar();
    cargarCatalogos().catch((e) => avisar(e.message, 'error'));
  }

  async function cambiarEstado(estado) {
    try {
      await ordenesApi.actualizar(abierta.id, { estado });
      avisar(`Orden ${abierta.numero}: ${NOMBRE_ESTADO[estado].toLowerCase()}`);
      setAbierta(null);
      recargarTodo();
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  async function eliminar() {
    try {
      await ordenesApi.eliminar(eliminando.id);
      avisar(`Orden ${eliminando.numero} eliminada`);
      recargarTodo();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setEliminando(null);
    }
  }

  const totalListado = useMemo(() => ordenes.reduce((s, o) => s + Number(o.total), 0), [ordenes]);

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Órdenes de compra</h1>
          <p className="texto-suave">
            Cada orden une un departamento con un proveedor. Solo las pendientes se pueden editar.
          </p>
        </div>
        <button type="button" className="btn btn-primario" onClick={abrirNueva}>
          + Nueva orden
        </button>
      </header>

      <TarjetasMetricas metricas={metricasOrdenes(todas)} />

      <div className="tarjeta">
        <div className="barra-herramientas">
          <div className="filtros" role="group" aria-label="Filtrar por estado">
            {['', ...ESTADOS].map((estado) => (
              <button
                key={estado || 'todas'}
                type="button"
                className={`filtro ${filtroEstado === estado ? 'filtro-activo' : ''}`}
                aria-pressed={filtroEstado === estado}
                onClick={() => setFiltroEstado(estado)}
              >
                {estado ? NOMBRE_ESTADO[estado] : 'Todas'}
              </button>
            ))}
          </div>
          <span className="texto-suave">
            {ordenes.length} orden(es) · {dinero(totalListado)}
          </span>
        </div>

        <TablaDatos
          columnas={columnas}
          filas={ordenes}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          vacio={filtroEstado ? `No hay órdenes en estado ${NOMBRE_ESTADO[filtroEstado].toLowerCase()}.` : 'Todavía no hay órdenes de compra.'}
          acciones={(o) => (
            <>
              <button type="button" className="btn btn-pequeno" onClick={() => abrir(o)}>
                {o.estado === 'pendiente' ? 'Editar' : 'Ver'}
              </button>
              <button
                type="button"
                className="btn btn-pequeno btn-peligro-suave"
                onClick={() => setEliminando(o)}
                disabled={!eliminable(o)}
                title={eliminable(o) ? undefined : 'Solo se eliminan órdenes pendientes o anuladas'}
              >
                Eliminar
              </button>
            </>
          )}
        />
      </div>

      {abierta && catalogos && (
        <Modal
          titulo={abierta.nueva ? 'Nueva orden de compra' : `Orden ${abierta.numero}`}
          onCerrar={() => setAbierta(null)}
          ancho="lg"
        >
          <OrdenForm
            orden={abierta.nueva ? null : abierta}
            catalogos={catalogos}
            numeroSugerido={siguienteNumero(todas)}
            onGuardar={guardar}
            onCambiarEstado={cambiarEstado}
            onCancelar={() => setAbierta(null)}
          />
        </Modal>
      )}

      {eliminando && (
        <ConfirmarEliminar
          titulo="Eliminar orden"
          mensaje={`¿Seguro que quieres eliminar la orden ${eliminando.numero}? También se eliminarán sus líneas de detalle.`}
          onConfirmar={eliminar}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </section>
  );
}
