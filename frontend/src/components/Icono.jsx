// Iconos de trazo (24×24) para el menú lateral
const TRAZOS = {
  cerebro: [
    'M9.5 3A2.5 2.5 0 0 0 7 5.5v.3A3 3 0 0 0 4.5 9a3 3 0 0 0 .4 1.5A3 3 0 0 0 4 13a3 3 0 0 0 2 2.8V16a3 3 0 0 0 3 3 2.5 2.5 0 0 0 3 0V4.5A2.5 2.5 0 0 0 9.5 3Z',
    'M14.5 3A2.5 2.5 0 0 1 17 5.5v.3A3 3 0 0 1 19.5 9a3 3 0 0 1-.4 1.5A3 3 0 0 1 20 13a3 3 0 0 1-2 2.8V16a3 3 0 0 1-3 3 2.5 2.5 0 0 1-3 0',
  ],
  escudo: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm9 12 2 2 4-4'],
  usuarios: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0', 'M19 8v6', 'M22 11h-6'],
  carrito: ['M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6', 'M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M17.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  resumen: ['M3 13h8V3H3z', 'M13 21h8V11h-8z', 'M3 21h8v-6H3z', 'M13 9h8V3h-8z'],
  ordenes: ['M6 2h9l5 5v15H6z', 'M14 2v6h6', 'M9 13h7', 'M9 17h5'],
  requisiciones: ['M9 4h6v3H9z', 'M7 5H5v16h14V5h-2', 'm9 13 2 2 4-4'],
  cotizaciones: ['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z', 'M7.5 7.5h.01'],
  recepciones: ['M3 7h11v10H3z', 'M14 10h4l3 3v4h-7', 'M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'],
  facturas: ['M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  pagos: ['M2 6h20v12H2z', 'M2 10h20', 'M6 15h4'],
  metodos: ['M3 7a2 2 0 0 1 2-2h13v4', 'M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z', 'M16 14.5h.01'],
  proveedores: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6', 'M9 10h.01', 'M15 10h.01'],
  contactos: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  productos: ['m21 8-9-5-9 5 9 5 9-5Z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
  categorias: ['m12 2 9 5-9 5-9-5 9-5Z', 'm3 12 9 5 9-5', 'm3 17 9 5 9-5'],
  bodegas: ['M3 21V9l9-6 9 6v12', 'M7 21v-8h10v8', 'M7 17h10'],
  existencias: ['M3 3v18h18', 'M7 15v3', 'M12 10v8', 'M17 6v12'],
  movimientos: ['M7 4v16', 'm3 8 4-4 4 4', 'M17 20V4', 'm13 16 4 4 4-4'],
  alerta: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.9 1.9 0 0 0 3.4 0'],
  trazabilidad: ['M5 3v18', 'M5 6h9l-2 3 2 3H5', 'M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M12 19h5'],
  duplicados: ['M8 8h12v12H8z', 'M4 16V4h12'],
  departamentos: ['M4 21V4h10v17', 'M14 9h6v12', 'M8 8h2', 'M8 12h2', 'M8 16h2', 'M2 21h20'],
  empleados: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
};

export default function Icono({ nombre, tamano = 18 }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true">
      {(TRAZOS[nombre] || []).map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
