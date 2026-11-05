import { useListado } from '../hooks/useListado';

/**
 * Lista desplegable con los registros de otra entidad (departamento, proveedor…).
 * fuente: { api, texto: (registro) => string, filtro?: (registro) => boolean }
 * El valor actual se muestra aunque el filtro lo excluya (por ejemplo, un proveedor ya inactivo).
 */
export default function SelectRelacion({ fuente, valorActual, ...props }) {
  const { datos, cargando, error } = useListado(fuente.api.listar);
  const opciones = datos.filter(
    (r) => !fuente.filtro || fuente.filtro(r) || String(r.id) === String(valorActual)
  );

  let textoVacio = '— Selecciona —';
  if (cargando && !datos.length) textoVacio = 'Cargando…';
  if (error) textoVacio = 'No se pudo cargar la lista';

  return (
    <select {...props}>
      <option value="">{textoVacio}</option>
      {opciones.map((r) => (
        <option key={r.id} value={r.id}>
          {fuente.texto(r)}
        </option>
      ))}
    </select>
  );
}
