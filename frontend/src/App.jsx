import { useEffect, useState } from 'react';
import { AvisosProvider } from './components/Avisos';
import ResumenPage from './pages/ResumenPage';
import OrdenesPage from './pages/OrdenesPage';
import ProveedoresPage from './pages/ProveedoresPage';
import DepartamentosPage from './pages/DepartamentosPage';
import ProductosPage from './pages/ProductosPage';

const RUTAS = [
  { ruta: '/', titulo: 'Resumen', Pagina: ResumenPage },
  { ruta: '/ordenes', titulo: 'Órdenes de compra', Pagina: OrdenesPage },
  { ruta: '/proveedores', titulo: 'Proveedores', Pagina: ProveedoresPage },
  { ruta: '/departamentos', titulo: 'Departamentos', Pagina: DepartamentosPage },
  { ruta: '/productos', titulo: 'Productos', Pagina: ProductosPage },
];

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
            {RUTAS.map((r) => (
              <a
                key={r.ruta}
                href={`#${r.ruta}`}
                className={`nav-enlace ${r === actual ? 'nav-activo' : ''}`}
                aria-current={r === actual ? 'page' : undefined}
              >
                {r.titulo}
              </a>
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
