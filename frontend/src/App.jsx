import { useEffect, useState } from 'react';
import { AvisosProvider } from './components/Avisos';
import ResumenPage from './pages/ResumenPage';
import OrdenesPage from './pages/OrdenesPage';
import RequisicionesPage from './pages/RequisicionesPage';
import CotizacionesPage from './pages/CotizacionesPage';
import RecepcionesPage from './pages/RecepcionesPage';
import FacturasPage from './pages/FacturasPage';
import PagosPage from './pages/PagosPage';
import MetodosPagoPage from './pages/MetodosPagoPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ContactosPage from './pages/ContactosPage';
import ProductosPage from './pages/ProductosPage';
import CategoriasPage from './pages/CategoriasPage';
import BodegasPage from './pages/BodegasPage';
import ExistenciasPage from './pages/ExistenciasPage';
import DepartamentosPage from './pages/DepartamentosPage';
import EmpleadosPage from './pages/EmpleadosPage';

// Menú lateral agrupado por área
const SECCIONES = [
  { titulo: null, rutas: [{ ruta: '/', titulo: 'Resumen', Pagina: ResumenPage }] },
  {
    titulo: 'Compras',
    rutas: [
      { ruta: '/ordenes', titulo: 'Órdenes de compra', Pagina: OrdenesPage },
      { ruta: '/requisiciones', titulo: 'Requisiciones', Pagina: RequisicionesPage },
      { ruta: '/cotizaciones', titulo: 'Cotizaciones', Pagina: CotizacionesPage },
      { ruta: '/recepciones', titulo: 'Recepciones', Pagina: RecepcionesPage },
    ],
  },
  {
    titulo: 'Cuentas por pagar',
    rutas: [
      { ruta: '/facturas', titulo: 'Facturas', Pagina: FacturasPage },
      { ruta: '/pagos', titulo: 'Pagos', Pagina: PagosPage },
      { ruta: '/metodos-pago', titulo: 'Métodos de pago', Pagina: MetodosPagoPage },
    ],
  },
  {
    titulo: 'Catálogos',
    rutas: [
      { ruta: '/proveedores', titulo: 'Proveedores', Pagina: ProveedoresPage },
      { ruta: '/contactos', titulo: 'Contactos', Pagina: ContactosPage },
      { ruta: '/productos', titulo: 'Productos', Pagina: ProductosPage },
      { ruta: '/categorias', titulo: 'Categorías', Pagina: CategoriasPage },
    ],
  },
  {
    titulo: 'Inventario',
    rutas: [
      { ruta: '/bodegas', titulo: 'Bodegas', Pagina: BodegasPage },
      { ruta: '/existencias', titulo: 'Existencias', Pagina: ExistenciasPage },
    ],
  },
  {
    titulo: 'Organización',
    rutas: [
      { ruta: '/departamentos', titulo: 'Departamentos', Pagina: DepartamentosPage },
      { ruta: '/empleados', titulo: 'Empleados', Pagina: EmpleadosPage },
    ],
  },
];

const RUTAS = SECCIONES.flatMap((s) => s.rutas);

// Navegación por hash (#/ordenes) sin dependencias extra
function useRutaActual() {
  const leer = () => window.location.hash.replace(/^#/, '') || '/';
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const alCambiar = () => setRuta(leer());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  return ruta;
}

export default function App() {
  const ruta = useRutaActual();
  const actual = RUTAS.find((r) => r.ruta === ruta) ?? RUTAS[0];
  const { Pagina } = actual;

  useEffect(() => {
    document.title = `${actual.titulo} · Órdenes de Compra`;
  }, [actual]);

  return (
    <AvisosProvider>
      <div className="app">
        <aside className="barra-lateral">
          <a className="marca" href="#/">
            <span className="marca-icono" aria-hidden="true">OC</span>
            <span>
              Órdenes de Compra
              <small>Gestión de compras</small>
            </span>
          </a>
          <nav aria-label="Secciones">
            {SECCIONES.map((seccion) => (
              <div key={seccion.titulo ?? 'inicio'} className="nav-grupo">
                {seccion.titulo && <span className="nav-titulo">{seccion.titulo}</span>}
                {seccion.rutas.map((r) => (
                  <a
                    key={r.ruta}
                    href={`#${r.ruta}`}
                    className={`nav-enlace ${r === actual ? 'nav-activo' : ''}`}
                    aria-current={r === actual ? 'page' : undefined}
                  >
                    {r.titulo}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="contenido">
          <Pagina key={actual.ruta} />
        </main>
      </div>
    </AvisosProvider>
  );
}
