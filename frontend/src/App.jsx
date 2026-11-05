import { useEffect, useState } from 'react';
import { AvisosProvider } from './components/Avisos';
import Icono from './components/Icono';
import { API_URL } from './services/api';
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
  { titulo: null, rutas: [{ ruta: '/', titulo: 'Resumen', icono: 'resumen', Pagina: ResumenPage }] },
  {
    titulo: 'Compras',
    rutas: [
      { ruta: '/ordenes', titulo: 'Órdenes de compra', icono: 'ordenes', Pagina: OrdenesPage },
      { ruta: '/requisiciones', titulo: 'Requisiciones', icono: 'requisiciones', Pagina: RequisicionesPage },
      { ruta: '/cotizaciones', titulo: 'Cotizaciones', icono: 'cotizaciones', Pagina: CotizacionesPage },
      { ruta: '/recepciones', titulo: 'Recepciones', icono: 'recepciones', Pagina: RecepcionesPage },
    ],
  },
  {
    titulo: 'Cuentas por pagar',
    rutas: [
      { ruta: '/facturas', titulo: 'Facturas', icono: 'facturas', Pagina: FacturasPage },
      { ruta: '/pagos', titulo: 'Pagos', icono: 'pagos', Pagina: PagosPage },
      { ruta: '/metodos-pago', titulo: 'Métodos de pago', icono: 'metodos', Pagina: MetodosPagoPage },
    ],
  },
  {
    titulo: 'Catálogos',
    rutas: [
      { ruta: '/proveedores', titulo: 'Proveedores', icono: 'proveedores', Pagina: ProveedoresPage },
      { ruta: '/contactos', titulo: 'Contactos', icono: 'contactos', Pagina: ContactosPage },
      { ruta: '/productos', titulo: 'Productos', icono: 'productos', Pagina: ProductosPage },
      { ruta: '/categorias', titulo: 'Categorías', icono: 'categorias', Pagina: CategoriasPage },
    ],
  },
  {
    titulo: 'Inventario',
    rutas: [
      { ruta: '/bodegas', titulo: 'Bodegas', icono: 'bodegas', Pagina: BodegasPage },
      { ruta: '/existencias', titulo: 'Existencias', icono: 'existencias', Pagina: ExistenciasPage },
    ],
  },
  {
    titulo: 'Organización',
    rutas: [
      { ruta: '/departamentos', titulo: 'Departamentos', icono: 'departamentos', Pagina: DepartamentosPage },
      { ruta: '/empleados', titulo: 'Empleados', icono: 'empleados', Pagina: EmpleadosPage },
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

// Preferencia del menú contraído; si el navegador no deja guardar, se usa el valor por defecto
function useMenuCompacto() {
  const [compacto, setCompacto] = useState(() => {
    try {
      return localStorage.getItem('menu-compacto') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('menu-compacto', compacto ? '1' : '0');
    } catch {
      // Sin almacenamiento: la preferencia dura solo esta visita
    }
  }, [compacto]);
  return [compacto, setCompacto];
}

// Consulta GET /api cada 30 s para mostrar si el back end responde
function useEstadoApi() {
  const [estado, setEstado] = useState('verificando');
  useEffect(() => {
    let activo = true;
    async function revisar() {
      try {
        const r = await fetch(API_URL);
        if (activo) setEstado(r.ok ? 'conectada' : 'sin-conexion');
      } catch {
        if (activo) setEstado('sin-conexion');
      }
    }
    revisar();
    const intervalo = setInterval(revisar, 30000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);
  return estado;
}

const TEXTO_API = { verificando: 'Verificando API…', conectada: 'API conectada', 'sin-conexion': 'API sin conexión' };

export default function App() {
  const ruta = useRutaActual();
  const actual = RUTAS.find((r) => r.ruta === ruta) ?? RUTAS[0];
  const { Pagina } = actual;
  const [compacto, setCompacto] = useMenuCompacto();
  const estadoApi = useEstadoApi();
  const seccionActual = SECCIONES.find((s) => s.rutas.includes(actual))?.titulo;

  useEffect(() => {
    document.title = `${actual.titulo} · Órdenes de Compra`;
  }, [actual]);

  return (
    <AvisosProvider>
      <div className={`app ${compacto ? 'app-compacta' : ''}`}>
        <aside className="barra-lateral">
          <a className="marca" href="#/" title="Órdenes de Compra">
            <span className="marca-icono" aria-hidden="true">OC</span>
            <span className="marca-texto">
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
                    title={compacto ? r.titulo : undefined}
                  >
                    <Icono nombre={r.icono} />
                    <span className="nav-texto">{r.titulo}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="barra-pie">
            <span className={`estado-api estado-api-${estadoApi}`} title={TEXTO_API[estadoApi]}>
              <span className="estado-api-punto" aria-hidden="true" />
              <span className="nav-texto">{TEXTO_API[estadoApi]}</span>
            </span>
            <button
              type="button"
              className="btn-contraer"
              onClick={() => setCompacto((c) => !c)}
              aria-label={compacto ? 'Expandir el menú' : 'Contraer el menú'}
              title={compacto ? 'Expandir el menú' : 'Contraer el menú'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d={compacto ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </aside>
        <main className="contenido">
          <div className="miga" aria-label="Ubicación">
            <span>Órdenes de Compra</span>
            {seccionActual && <span>{seccionActual}</span>}
            <span aria-current="page">{actual.titulo}</span>
          </div>
          <Pagina key={actual.ruta} />
        </main>
      </div>
    </AvisosProvider>
  );
}
