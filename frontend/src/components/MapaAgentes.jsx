import { useLayoutEffect, useRef } from 'react';

// Posiciones en el lienzo (viewBox 640 × 360)
export const NODOS = {
  cerebro: { x: 320, y: 70 },
  compras: { x: 110, y: 190 },
  inventario: { x: 320, y: 190 },
  finanzas: { x: 530, y: 190 },
  mysql: { x: 320, y: 312 },
};

export const AGENTES_INFO = {
  compras: { nombre: 'Compras', color: '#3b82f6', icono: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6' },
  inventario: { nombre: 'Inventario', color: '#10b981', icono: 'M3 21V9l9-6 9 6v12M7 21v-8h10v8' },
  finanzas: { nombre: 'Finanzas', color: '#f97316', icono: 'M2 6h20v12H2zM2 10h20M6 15h4' },
};

// Cuánto se desplaza cada agente según lo que está haciendo
const DESPLAZAMIENTO = { consultando: 46, entregando: -34 };

const ruta = (de, a) => `M${NODOS[de].x},${NODOS[de].y} L${NODOS[a].x},${NODOS[a].y}`;

// Punto de luz que viaja por una conexión una sola vez
function Viaje({ de, a, color }) {
  const animacion = useRef(null);
  useLayoutEffect(() => {
    animacion.current?.beginElement?.();
  }, []);
  return (
    <circle r="7" fill={color} className="viaje">
      <animateMotion ref={animacion} dur="1.1s" begin="indefinite" fill="freeze" path={ruta(de, a)} />
    </circle>
  );
}

/**
 * estados: { compras: { fase, etiqueta }, ... }  fase: inactivo | trabajando | consultando | entregando | listo | error
 * cerebro: 'inactivo' | 'pensando'
 * viajes: [{ id, de, a, color }]
 */
export default function MapaAgentes({ estados, cerebro, viajes, mysqlActivo }) {
  return (
    <svg className="mapa-agentes" viewBox="0 0 640 360" role="img" aria-label="Mapa del cerebro, los agentes y la base de datos">
      <defs>
        <radialGradient id="grad-cerebro" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="60%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>
        <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Conexiones */}
      {Object.keys(AGENTES_INFO).map((clave) => (
        <g key={clave}>
          <path d={ruta('cerebro', clave)} className={`conexion ${estados[clave].fase !== 'inactivo' ? 'conexion-activa' : ''}`} style={{ '--color': AGENTES_INFO[clave].color }} />
          <path d={ruta(clave, 'mysql')} className={`conexion conexion-datos ${estados[clave].fase === 'consultando' ? 'conexion-activa' : ''}`} style={{ '--color': AGENTES_INFO[clave].color }} />
        </g>
      ))}

      {/* Base de datos */}
      <g className={`nodo-mysql ${mysqlActivo ? 'activo' : ''}`} transform={`translate(${NODOS.mysql.x} ${NODOS.mysql.y})`}>
        <ellipse cx="0" cy="-14" rx="34" ry="9" />
        <path d="M-34,-14 V14 A34,9 0 0 0 34,14 V-14" />
        <ellipse cx="0" cy="0" rx="34" ry="9" className="mysql-linea" />
        <text y="38" textAnchor="middle" className="nodo-nombre">MySQL</text>
      </g>

      {/* Cerebro */}
      <g className={`nodo-cerebro ${cerebro === 'pensando' ? 'pensando' : ''}`} transform={`translate(${NODOS.cerebro.x} ${NODOS.cerebro.y})`}>
        <circle r="44" className="aura" />
        <circle r="34" fill="url(#grad-cerebro)" filter="url(#brillo)" />
        <path
          d="M-6,-16 a8,8 0 0 0-13,6 a8,8 0 0 0-3,13 a8,8 0 0 0 7,10 a7,7 0 0 0 9,3 V-16Z M6,-16 a8,8 0 0 1 13,6 a8,8 0 0 1 3,13 a8,8 0 0 1-7,10 a7,7 0 0 1-9,3 V-16Z"
          fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round"
        />
        <text y="-50" textAnchor="middle" className="nodo-nombre">Cerebro</text>
      </g>

      {/* Agentes: se mueven hacia MySQL al consultar y hacia el cerebro al entregar */}
      {Object.entries(AGENTES_INFO).map(([clave, info]) => {
        const { fase, etiqueta } = estados[clave];
        const dy = DESPLAZAMIENTO[fase] || 0;
        return (
          <g key={clave} className={`nodo-agente fase-${fase}`} style={{ transform: `translate(${NODOS[clave].x}px, ${NODOS[clave].y + dy}px)`, '--color': info.color }}>
            <g className="agente-flotar">
              <circle r="30" className="agente-aura" />
              <circle r="24" className="agente-cuerpo" />
              <path d={info.icono} transform="translate(-12 -12)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text y="46" textAnchor="middle" className="nodo-nombre">{info.nombre}</text>
            {etiqueta && <text y="62" textAnchor="middle" className="nodo-etiqueta">{etiqueta}</text>}
          </g>
        );
      })}

      {/* Mensajes viajando */}
      {viajes.map((v) => (
        <Viaje key={v.id} {...v} />
      ))}
    </svg>
  );
}
