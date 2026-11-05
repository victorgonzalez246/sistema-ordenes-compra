import { useMemo, useState } from 'react';
import { useListado } from '../hooks/useListado';
import { useAvisos } from './Avisos';
import TablaDatos from './TablaDatos';
import ConfirmarEliminar from './ConfirmarEliminar';
import Modal from './Modal';

/**
 * Pantalla CRUD de un catálogo: búsqueda, tabla, alta/edición en modal y
 * eliminación con confirmación.
 */
export default function PaginaCatalogo({
  titulo,
  descripcion,
  singular,
  api,
  columnas,
  Formulario,
  camposBusqueda,
  nombreDe,
}) {
  const { datos, cargando, error, recargar } = useListado(api.listar);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // null: cerrado · {}: nuevo · registro: edición
  const [eliminando, setEliminando] = useState(null);
  const avisar = useAvisos();

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return datos;
    return datos.filter((fila) => camposBusqueda.some((c) => String(fila[c] ?? '').toLowerCase().includes(q)));
  }, [datos, busqueda, camposBusqueda]);

  async function guardar(valores) {
    if (editando.id) {
      await api.actualizar(editando.id, valores);
      avisar(`${singular} actualizado`);
    } else {
      await api.crear(valores);
      avisar(`${singular} creado`);
    }
    setEditando(null);
    recargar();
  }

  async function eliminar() {
    try {
      await api.eliminar(eliminando.id);
      avisar(`${singular} eliminado`);
      recargar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setEliminando(null);
    }
  }

  return (
    <section className="pagina">
      <header className="pagina-cabecera">
        <div>
          <h1>{titulo}</h1>
          <p className="texto-suave">{descripcion}</p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => setEditando({})}>
          + Nuevo {singular.toLowerCase()}
        </button>
      </header>

      <div className="tarjeta">
        <div className="barra-herramientas">
          <input
            type="search"
            className="buscador"
            placeholder="Buscar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label={`Buscar en ${titulo.toLowerCase()}`}
          />
          <span className="texto-suave">
            {filtrados.length} de {datos.length}
          </span>
        </div>

        <TablaDatos
          columnas={columnas}
          filas={filtrados}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          vacio={busqueda ? 'No hay resultados para la búsqueda.' : `Todavía no hay registros. Crea el primero con “Nuevo ${singular.toLowerCase()}”.`}
          acciones={(fila) => (
            <>
              <button type="button" className="btn btn-pequeno" onClick={() => setEditando(fila)}>
                Editar
              </button>
              <button type="button" className="btn btn-pequeno btn-peligro-suave" onClick={() => setEliminando(fila)}>
                Eliminar
              </button>
            </>
          )}
        />
      </div>

      {editando && (
        <Modal
          titulo={editando.id ? `Editar ${singular.toLowerCase()}` : `Nuevo ${singular.toLowerCase()}`}
          onCerrar={() => setEditando(null)}
        >
          <Formulario inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
        </Modal>
      )}

      {eliminando && (
        <ConfirmarEliminar
          titulo={`Eliminar ${singular.toLowerCase()}`}
          mensaje={`¿Seguro que quieres eliminar “${nombreDe(eliminando)}”?`}
          onConfirmar={eliminar}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </section>
  );
}
