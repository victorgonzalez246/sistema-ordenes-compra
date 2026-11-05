// Diseño común de las pantallas de login y registro: presentación a la izquierda, formulario a la derecha
const PUNTOS = [
  ['Compras de punta a punta', 'Requisiciones, cotizaciones, órdenes, recepciones y pagos en un solo lugar.'],
  ['Control del presupuesto', 'Gasto comprometido por departamento frente a lo asignado.'],
  ['Cuentas por pagar al día', 'Saldos, vencimientos y pagos de cada factura de proveedor.'],
];

export default function PantallaAcceso({ titulo, subtitulo, children }) {
  return (
    <div className="acceso">
      <section className="acceso-presentacion" aria-hidden="true">
        <span className="marca-icono acceso-logo">OC</span>
        <h2>Órdenes de Compra</h2>
        <p>Sistema de gestión de compras para la empresa.</p>
        <ul>
          {PUNTOS.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <main className="acceso-tarjeta">
        <span className="marca-icono acceso-logo-movil" aria-hidden="true">OC</span>
        <h1>{titulo}</h1>
        <p className="texto-suave">{subtitulo}</p>
        {children}
      </main>
    </div>
  );
}
