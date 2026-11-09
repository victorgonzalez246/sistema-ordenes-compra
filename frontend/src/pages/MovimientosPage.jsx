import { useCallback, useMemo, useState } from 'react';
import { useListado } from '../hooks/useListado';
import { useAvisos } from '../components/Avisos';
import TablaDatos from '../components/TablaDatos';
import TarjetasMetricas from '../components/TarjetasMetricas';
import Modal from '../components/Modal';
import Insignia from '../components/Insignia';
import MovimientoForm from '../components/MovimientoForm';
import SelectRelacion from '../components/SelectRelacion';
import { fuentes } from '../services/fuentes';
import { movimientosApi, TIPOS_MOVIMIENTO, DOCUMENTOS, enlaceTrazabilidad } from '../services/inventario';
import { entero, fecha } from '../utils/formato';

const columnas = [
  { clave: 'fecha', titulo: 'Fecha', render: (m) => <span className="sin-corte">{fecha(m.fecha)}</span> },
  { clave: 'tipo', titulo: 'Tipo', render: (m) => <Insignia texto={TIPOS_MOVIMIENTO[m.tipo]} clase={`tipo-${m.tipo}`} /> },
  {
    clave: 'producto',
    titulo: 'Material',
    render: (m) => (
      <div className="celda-material">
        <a href={enlaceTrazabilidad(m.producto?.id)} title="Ver trazabilidad">
          <strong>{m.producto?.nombre}</strong>
        </a>
        <div className="texto-suave"><code>{m.producto?.codigo}</code></div>
      </div>
    ),
  },
  {
    clave: 'cantidad',
    titulo: 'Cantidad',
    alinear: 'derecha',
    render: (m) => `${entero(m.cantidad)} ${m.producto?.unidad ?? ''}`,
  },
  {
    clave: 'ubicacion',
    titulo: 'Ubicación',
    render: (m) => {
      if (m.bodega_origen && m.bodega_destino) return `${m.bodega_origen.nombre} → ${m.bodega_destino.nombre}`;
      if (m.bodega_origen) return `Sale de ${m.bodega_origen.nombre}`;
      return `Entra a ${m.bodega_destino?.nombre}`;
    },
  },
  {
    clave: 'documento',
    titulo: 'Documento',
    render: (m) => (
      <>
        <strong className="sin-corte">{m.documento_numero}</strong>
        <div className="texto-suave">
          {DOCUMENTOS[m.documento_tipo]}
          {m.orden?.proveedor ? ` · ${m.orden.proveedor.razon_social}` : ''}
        </div>
      </>
    ),
  },
  { clave: 'usuario', titulo: 'Registró', render: (m) => m.usuario?.nombre ?? '—' },
];

function metricasMovimientos(lista) {
  const contar = (tipo) => lista.filter((m) => m.tipo === tipo).length;
  return [
    { titulo: 'Movimientos', valor: entero(lista.length), detalle: 'según el filtro actual' },
    { titulo: 'Entradas', valor: entero(contar('entrada')), detalle: 'compras e inventario inicial' },
    { titulo: 'Salidas', valor: entero(contar('salida')), detalle: 'consumo en obras y taller' },
    { titulo: 'Traslados y ajustes', valor: entero(contar('traslado') + contar('ajuste')), detalle: `${contar('ajuste')} ajuste(s)` },
  ];
}

const TEXTO_ALERTA = {
  abierta: 'se abrió una alerta de reorden',
  escalada: 'la alerta de reorden pasó a URGENTE',
  cerrada: 'se cerró la alerta de reorden',
};

export default function MovimientosPage() {
  const [filtros, setFiltros] = useState({ tipo: '', producto_id: '', bodega_id: '' });
  const cargar = useCallback(() => movimientosApi.listar(filtros), [filtros]);
  const { datos, cargando, error, recargar } = useListado(cargar);
  const [creando, setCreando] = useState(false);
  const avisar = useAvisos();
  const metricas = useMemo(() => metricasMovimientos(datos), [datos]);

  const cambiarFiltro = (campo) => (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value }));

  async function guardar(valores) {
    const { alerta, stock } = await movimientosApi.crear(valores);
    const extra = alerta && TEXTO_ALERTA[alerta.accion] ? `; ${TEXTO_ALERTA[alerta.accion]}` : '';
    avisar(`Movimiento registrado. Stock total: ${entero(stock.stock)}${extra}`, alerta?.prioridad === 'urgente' ? 'error' : 'exito');
    setCreando(false);
    recargar();
  }

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>Movimientos de inventario</h1>
          <p className="texto-suave">
            Cada entrada, salida, traslado o ajuste. El stock de cada bodega se calcula con estos movimientos; no se editan ni se borran,
            un error se corrige con un ajuste.
          </p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => setCreando(true)}>
          + Nuevo movimiento
        </button>
      </header>

      <TarjetasMetricas metricas={metricas} />

      <div className="tarjeta">
        <div className="barra-herramientas">
          <div className="filtros" role="group" aria-label="Filtrar por tipo">
            {['', ...Object.keys(TIPOS_MOVIMIENTO)].map((tipo) => (
              <button
                key={tipo || 'todos'}
                type="button"
                className={`filtro ${filtros.tipo === tipo ? 'filtro-activo' : ''}`}
                aria-pressed={filtros.tipo === tipo}
                onClick={() => setFiltros((f) => ({ ...f, tipo }))}
              >
                {tipo ? TIPOS_MOVIMIENTO[tipo] : 'Todos'}
              </button>
            ))}
          </div>
          <div className="filtros-inventario">
            <label className="campo">
              <span className="campo-etiqueta">Material</span>
              <SelectRelacion value={filtros.producto_id} onChange={cambiarFiltro('producto_id')} fuente={fuentes.producto} opcionVacia="Todos los materiales" />
            </label>
            <label className="campo">
              <span className="campo-etiqueta">Bodega u obra</span>
              <SelectRelacion value={filtros.bodega_id} onChange={cambiarFiltro('bodega_id')} fuente={fuentes.bodega} opcionVacia="Todas" />
            </label>
          </div>
        </div>

        <TablaDatos
          columnas={columnas}
          filas={datos}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          vacio="No hay movimientos con ese filtro."
        />
      </div>

      {creando && (
        <Modal titulo="Nuevo movimiento" onCerrar={() => setCreando(false)}>
          <MovimientoForm onGuardar={guardar} onCancelar={() => setCreando(false)} />
        </Modal>
      )}
    </section>
  );
}
