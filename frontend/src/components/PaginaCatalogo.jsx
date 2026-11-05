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
  femenino = false,
}) {
  // "Nuevo proveedor" / "Nueva factura", "creado" / "creada"
  const nuevo = femenino ? 'Nueva' : 'Nuevo';
  const terminacion = femenino ? 'a' : 'o';
  const minuscula = singular.toLowerCase();
  const { datos, cargando, error, recargar } = useListado(api.listar);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // null: cerrado · {}: nuevo · registro: edición
  const [eliminando, setEliminando] = useState(null);
  const avisar = useAvisos();

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return datos;
    // Cada campo de búsqueda es una clave ("nombre") o una función (fila) => texto
    const texto = (fila, c) => (typeof c === 'function' ? c(fila) : fila[c]);
    return datos.filter((fila) => camposBusqueda.some((c) => String(texto(fila, c) ?? '').toLowerCase().includes(q)));
  }, [datos, busqueda, camposBusqueda]);

  async function guardar(valores) {
    if (editando.id) {
      await api.actualizar(editando.id, valores);
      avisar(`${singular} actualizad${terminacion}`);
    } else {
      await api.crear(valores);
      avisar(`${singular} cread${terminacion}`);
    }
    setEditando(null);
    recargar();
  }

  async function eliminar() {
    try {
      await api.eliminar(eliminando.id);
      avisar(`${singular} eliminad${terminacion}`);
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
          + {nuevo} {minuscula}
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
          vacio={busqueda ? 'No hay resultados para la búsqueda.' : `Todavía no hay registros. Crea el primero con “${nuevo} ${minuscula}”.`}
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
          titulo={editando.id ? `Editar ${minuscula}` : `${nuevo} ${minuscula}`}
          onCerrar={() => setEditando(null)}
        >
          <Formulario inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
        </Modal>
      )}

      {eliminando && (
        <ConfirmarEliminar
          titulo={`Eliminar ${minuscula}`}
          mensaje={`¿Seguro que quieres eliminar “${nombreDe(eliminando)}”?`}
          onConfirmar={eliminar}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </section>
  );
}
