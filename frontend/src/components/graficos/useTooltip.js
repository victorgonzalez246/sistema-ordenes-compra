import { useRef, useState } from 'react';

/**
 * Tooltip de un gráfico. `area` va en el contenedor (position: relative) y
 * `eventos(contenido)` en cada marca: responde al puntero y al foco del teclado.
 * contenido: { titulo, filas: [{ color, etiqueta, valor }] }
 */
export function useTooltip() {
  const area = useRef(null);
  const [tip, setTip] = useState(null);

  function posicion(e) {
    const caja = area.current.getBoundingClientRect();
    if (e.type === 'pointermove') return { x: e.clientX - caja.left, y: e.clientY - caja.top };
    const marca = e.currentTarget.getBoundingClientRect();
    return { x: marca.left + marca.width / 2 - caja.left, y: marca.top - caja.top };
  }

  const eventos = (contenido) => ({
    tabIndex: 0,
    onPointerMove: (e) => setTip({ ...posicion(e), contenido }),
    onPointerLeave: () => setTip(null),
    onFocus: (e) => setTip({ ...posicion(e), contenido }),
    onBlur: () => setTip(null),
  });

  return { area, tip, eventos };
}
