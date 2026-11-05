import { useState } from 'react';
import Campo from './Campo';
import PieFormulario from './PieFormulario';
import EstadoOrden, { NOMBRE_ESTADO, TRANSICIONES } from './EstadoOrden';
import { useFormulario } from '../hooks/useFormulario';
import { dinero, fecha, hoyISO, numeroONulo } from '../utils/formato';

const ACCION_ESTADO = {
  aprobada: { texto: 'Aprobar', clase: 'btn-exito' },
  recibida: { texto: 'Marcar como recibida', clase: 'btn-exito' },
  anulada: { texto: 'Anular', clase: 'btn-peligro-suave' },
};

let contadorLineas = 0;
const nuevaLinea = (datos = {}) => ({
  clave: ++contadorLineas,
  producto_id: datos.producto_id ?? '',
  cantidad: datos.cantidad ?? 1,
  precio_unitario: datos.precio_unitario ?? '',
});

const subtotalDe = (l) => (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0);

/**
 * Crea, edita o consulta una orden de compra.
 * Solo las órdenes pendientes se pueden editar; las demás muestran sus datos
 * y los cambios de estado permitidos.
 */
export default function OrdenForm({ orden, catalogos, numeroSugerido, onGuardar, onCambiarEstado, onCancelar }) {
  const { departamentos, proveedores, productos } = catalogos;
  const editable = !orden || orden.estado === 'pendiente';
  const [confirmarAnular, setConfirmarAnular] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const { valores, setValores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    numero: orden?.numero ?? numeroSugerido,
    fecha: orden?.fecha ?? hoyISO(),
    departamento_id: orden?.departamento_id ?? '',
    proveedor_id: orden?.proveedor_id ?? '',
    detalles: orden?.detalles?.length ? orden.detalles.map(nuevaLinea) : [nuevaLinea()],
  });

  const total = valores.detalles.reduce((suma, l) => suma + subtotalDe(l), 0);
  const proveedoresDisponibles = proveedores.filter((p) => p.activo || p.id === orden?.proveedor_id);

  function cambiarLinea(indice, campo, valor) {
    setValores((v) => {
      const detalles = v.detalles.map((l, i) => {
        if (i !== indice) return l;
        const linea = { ...l, [campo]: valor };
        // Al elegir un producto se propone su precio de referencia
        if (campo === 'producto_id') {
          const producto = productos.find((p) => p.id === Number(valor));
          linea.precio_unitario = producto?.precio_ref ?? '';
        }
        return linea;
      });
      return { ...v, detalles };
    });
  }

  const agregarLinea = () => setValores((v) => ({ ...v, detalles: [...v.detalles, nuevaLinea()] }));
  const quitarLinea = (indice) =>
    setValores((v) => ({ ...v, detalles: v.detalles.filter((_, i) => i !== indice) }));

  function alEnviar(e) {
    e.preventDefault();
    enviar(() =>
      onGuardar({
        numero: valores.numero.trim(),
        fecha: valores.fecha,
        departamento_id: numeroONulo(valores.departamento_id),
        proveedor_id: numeroONulo(valores.proveedor_id),
        detalles: valores.detalles.map((l) => ({
          producto_id: numeroONulo(l.producto_id),
          cantidad: numeroONulo(l.cantidad),
          precio_unitario: numeroONulo(l.precio_unitario),
        })),
      })
    );
  }

  async function cambiarEstado(estado) {
    setCambiandoEstado(true);
    try {
      await onCambiarEstado(estado);
    } finally {
      setCambiandoEstado(false);
      setConfirmarAnular(false);
    }
  }

  // Botones de cambio de estado para una orden existente
  const accionesEstado = orden && (
    <>
      {confirmarAnular ? (
        <span className="confirmacion-en-linea">
          ¿Anular la orden?
          <button type="button" className="btn btn-pequeno btn-peligro" onClick={() => cambiarEstado('anulada')} disabled={cambiandoEstado}>
            Sí, anular
          </button>
          <button type="button" className="btn btn-pequeno" onClick={() => setConfirmarAnular(false)}>
            No
          </button>
        </span>
      ) : (
        TRANSICIONES[orden.estado].map((estado) => (
          <button
            key={estado}
            type="button"
            className={`btn ${ACCION_ESTADO[estado].clase}`}
            disabled={cambiandoEstado || enviando}
            onClick={() => (estado === 'anulada' ? setConfirmarAnular(true) : cambiarEstado(estado))}
          >
            {ACCION_ESTADO[estado].texto}
          </button>
        ))
      )}
    </>
  );

  if (!editable) {
    return (
      <>
        <div className="modal-cuerpo">
          <dl className="ficha">
            <div><dt>Número</dt><dd>{orden.numero}</dd></div>
            <div><dt>Fecha</dt><dd>{fecha(orden.fecha)}</dd></div>
            <div><dt>Estado</dt><dd><EstadoOrden estado={orden.estado} /></dd></div>
            <div><dt>Departamento</dt><dd>{orden.departamento?.nombre}</dd></div>
            <div className="ancho-completo"><dt>Proveedor</dt><dd>{orden.proveedor?.razon_social} · {orden.proveedor?.rif}</dd></div>
          </dl>
          <div className="tabla-contenedor">
            <table className="tabla tabla-compacta">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="derecha">Cantidad</th>
                  <th className="derecha">Precio unit.</th>
                  <th className="derecha">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.detalles.map((d) => (
                  <tr key={d.id}>
                    <td data-titulo="Producto">{d.producto?.codigo} · {d.producto?.nombre}</td>
                    <td data-titulo="Cantidad" className="derecha">{d.cantidad} {d.producto?.unidad}</td>
                    <td data-titulo="Precio unit." className="derecha">{dinero(d.precio_unitario)}</td>
                    <td data-titulo="Subtotal" className="derecha">{dinero(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="total-orden">Total <strong>{dinero(orden.total)}</strong></p>
          {TRANSICIONES[orden.estado].length === 0 && (
            <p className="texto-suave">
              La orden está {NOMBRE_ESTADO[orden.estado].toLowerCase()}; es un estado final y ya no admite cambios.
            </p>
          )}
        </div>
        <footer className="modal-pie">
          <div className="pie-izquierda">{accionesEstado}</div>
          <button type="button" className="btn" onClick={onCancelar}>
            Cerrar
          </button>
        </footer>
      </>
    );
  }

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}

        <div className="rejilla-form rejilla-4">
          <Campo etiqueta="Número" requerido error={errores.numero}>
            <input {...enlazar('numero')} required maxLength={30} />
          </Campo>
          <Campo etiqueta="Fecha" requerido error={errores.fecha}>
            <input {...enlazar('fecha')} type="date" required />
          </Campo>
          <Campo etiqueta="Departamento" requerido error={errores.departamento_id}>
            <select {...enlazar('departamento_id')} required>
              <option value="">Selecciona…</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Proveedor" requerido error={errores.proveedor_id}>
            <select {...enlazar('proveedor_id')} required>
              <option value="">Selecciona…</option>
              {proveedoresDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razon_social}
                  {!p.activo ? ' (inactivo)' : ''}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="lineas-cabecera">
          <h3>Productos</h3>
          {orden && <EstadoOrden estado={orden.estado} />}
        </div>
        {errores.detalles && <div className="alerta alerta-error">{errores.detalles}</div>}

        <div className="lineas">
          <div className="linea linea-titulos" aria-hidden="true">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio unit. ($)</span>
            <span className="derecha">Subtotal</span>
            <span />
          </div>
          {valores.detalles.map((linea, i) => {
            const error = (campo) => errores[`detalles[${i}].${campo}`];
            return (
              <div className="linea" key={linea.clave}>
                <Campo etiqueta={`Producto ${i + 1}`} error={error('producto_id')} className="linea-producto">
                  <select
                    value={linea.producto_id}
                    onChange={(e) => cambiarLinea(i, 'producto_id', e.target.value)}
                    required
                  >
                    <option value="">Selecciona un producto…</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} · {p.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Cantidad" error={error('cantidad')}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={linea.cantidad}
                    onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)}
                    required
                  />
                </Campo>
                <Campo etiqueta="Precio unit. ($)" error={error('precio_unitario')}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={linea.precio_unitario}
                    onChange={(e) => cambiarLinea(i, 'precio_unitario', e.target.value)}
                  />
                </Campo>
                <span className="linea-subtotal">{dinero(subtotalDe(linea))}</span>
                <button
                  type="button"
                  className="btn-icono"
                  onClick={() => quitarLinea(i)}
                  disabled={valores.detalles.length === 1}
                  aria-label={`Quitar producto ${i + 1}`}
                  title="Quitar línea"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="lineas-pie">
          <button type="button" className="btn btn-pequeno" onClick={agregarLinea}>
            + Agregar producto
          </button>
          <p className="total-orden">
            Total <strong>{dinero(total)}</strong>
          </p>
        </div>
      </div>

      <PieFormulario enviando={enviando} onCancelar={onCancelar} textoGuardar={orden ? 'Guardar cambios' : 'Crear orden'}>
        {accionesEstado}
      </PieFormulario>
    </form>
  );
}
