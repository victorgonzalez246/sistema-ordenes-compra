import { useEffect, useState } from 'react';
import { AvisosProvider } from './components/Avisos';
import Icono from './components/Icono';
import RutaProtegida from './components/RutaProtegida';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
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
import UsuariosPage from './pages/UsuariosPage';
import AsistentePage from './pages/AsistentePage';
import { TEXTO_ROL } from './components/PanelAprobacion';
import MovimientosPage from './pages/MovimientosPage';
import AlertasReordenPage from './pages/AlertasReordenPage';
import TrazabilidadPage from './pages/TrazabilidadPage';
import DuplicadosPage from './pages/DuplicadosPage';

// Menú lateral agrupado por área
const SECCIONES = [
  {
    titulo: null,
    rutas: [
      { ruta: '/', titulo: 'Resumen', icono: 'resumen', Pagina: ResumenPage },
      { ruta: '/asistente', titulo: 'Asistente IA', icono: 'cerebro', Pagina: AsistentePage },
    ],
  },
  {
    titulo: 'Compras',
    icono: 'carrito',
    rutas: [
      { ruta: '/ordenes', titulo: 'Órdenes de compra', icono: 'ordenes', Pagina: OrdenesPage },
      { ruta: '/requisiciones', titulo: 'Requisiciones', icono: 'requisiciones', Pagina: RequisicionesPage },
      { ruta: '/cotizaciones', titulo: 'Cotizaciones', icono: 'cotizaciones', Pagina: CotizacionesPage },
      { ruta: '/recepciones', titulo: 'Recepciones', icono: 'recepciones', Pagina: RecepcionesPage },
      { ruta: '/duplicados', titulo: 'Posibles duplicados', icono: 'duplicados', Pagina: DuplicadosPage },
    ],
  },
  {
    titulo: 'Cuentas por pagar',
    icono: 'pagos',
    rutas: [
      { ruta: '/facturas', titulo: 'Facturas', icono: 'facturas', Pagina: FacturasPage },
      { ruta: '/pagos', titulo: 'Pagos', icono: 'pagos', Pagina: PagosPage },
      { ruta: '/metodos-pago', titulo: 'Métodos de pago', icono: 'metodos', Pagina: MetodosPagoPage },
    ],
  },
  {
    titulo: 'Catálogos',
    icono: 'productos',
    rutas: [
      { ruta: '/proveedores', titulo: 'Proveedores', icono: 'proveedores', Pagina: ProveedoresPage },
      { ruta: '/contactos', titulo: 'Contactos', icono: 'contactos', Pagina: ContactosPage },
      { ruta: '/productos', titulo: 'Productos', icono: 'productos', Pagina: ProductosPage },
      { ruta: '/categorias', titulo: 'Categorías', icono: 'categorias', Pagina: CategoriasPage },
    ],
  },
  {
    titulo: 'Inventario',
    icono: 'bodegas',
    rutas: [
      { ruta: '/bodegas', titulo: 'Bodegas', icono: 'bodegas', Pagina: BodegasPage },
      { ruta: '/alertas-reorden', titulo: 'Alertas de reorden', icono: 'alerta', Pagina: AlertasReordenPage },
      { ruta: '/movimientos', titulo: 'Movimientos', icono: 'movimientos', Pagina: MovimientosPage },
      { ruta: '/trazabilidad', titulo: 'Trazabilidad', icono: 'trazabilidad', Pagina: TrazabilidadPage },
      { ruta: '/existencias', titulo: 'Existencias', icono: 'existencias', Pagina: ExistenciasPage },
    ],
  },
  {
    titulo: 'Organización',
    icono: 'departamentos',
    rutas: [
      { ruta: '/departamentos', titulo: 'Departamentos', icono: 'departamentos', Pagina: DepartamentosPage },
      { ruta: '/empleados', titulo: 'Empleados', icono: 'empleados', Pagina: EmpleadosPage },
    ],
  },
  {
    titulo: 'Seguridad',
    icono: 'escudo',
    rutas: [{ ruta: '/usuarios', titulo: 'Usuarios', icono: 'usuarios', Pagina: UsuariosPage }],
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

// Iniciales para el avatar: "Administrador de Compras" -> "AC"
const iniciales = (nombre = '') =>
  nombre
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export default function App() {
  return (
    <AuthProvider>
      <AvisosProvider>
        <Rutas />
      </AvisosProvider>
    </AuthProvider>
  );
}

// Login y registro son públicos; el resto del sistema exige sesión iniciada
function Rutas() {
  const ruta = useRutaActual();
  if (ruta === '/login') return <Login />;
  if (ruta === '/registro') return <Registro />;
  return (
    <RutaProtegida ruta={ruta}>
      <Panel ruta={ruta} />
    </RutaProtegida>
  );
}

function Panel({ ruta }) {
  // La ruta puede traer parámetros (#/trazabilidad?producto=1): se comparan solo con la parte antes del "?"
  const actual = RUTAS.find((r) => r.ruta === ruta.split('?')[0]) ?? RUTAS[0];
  const { Pagina } = actual;
  const { usuario, cerrarSesion } = useAuth();
  const [compacto, setCompacto] = useMenuCompacto();
  const estadoApi = useEstadoApi();
  const seccionActual = SECCIONES.find((s) => s.rutas.includes(actual))?.titulo;

  // Acordeón: un solo grupo abierto; al navegar se abre el grupo de la pantalla actual
  const [grupoAbierto, setGrupoAbierto] = useState(seccionActual ?? null);
  useEffect(() => {
    if (seccionActual) setGrupoAbierto(seccionActual);
  }, [seccionActual]);

  useEffect(() => {
    document.title = `${actual.titulo} · Órdenes de Compra`;
  }, [actual]);

  return (
    <>
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
            {SECCIONES.map((seccion) => {
              const enlaces = seccion.rutas.map((r) => (
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
              ));

              // Resumen va suelto, sin grupo
              if (!seccion.titulo) return <div key="inicio" className="nav-grupo">{enlaces}</div>;

              const abierto = grupoAbierto === seccion.titulo;
              const idLista = `grupo-${seccion.icono}`;
              return (
                <div key={seccion.titulo} className={`nav-grupo nav-acordeon ${abierto ? 'abierto' : ''} ${seccion.titulo === seccionActual ? 'contiene-activo' : ''}`}>
                  <button
                    type="button"
                    className="nav-cabecera"
                    aria-expanded={abierto}
                    aria-controls={idLista}
                    title={compacto ? seccion.titulo : undefined}
                    onClick={() => setGrupoAbierto(abierto ? null : seccion.titulo)}
                  >
                    <Icono nombre={seccion.icono} />
                    <span className="nav-texto">{seccion.titulo}</span>
                    <span className="nav-cuenta nav-texto">{seccion.rutas.length}</span>
                    <svg className="nav-flecha" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div id={idLista} className="nav-lista">
                    <div className="nav-lista-interior">{enlaces}</div>
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="usuario-actual" title={compacto ? usuario?.nombre : undefined}>
            <span className="usuario-avatar" aria-hidden="true">{iniciales(usuario?.nombre)}</span>
            <span className="usuario-datos nav-texto">
              <strong>{usuario?.nombre ?? 'Cargando…'}</strong>
              <small title={usuario?.correo}>{TEXTO_ROL[usuario?.rol] ?? usuario?.correo}</small>
            </span>
            <button
              type="button"
              className="btn-salir"
              onClick={() => cerrarSesion('Cerraste sesión.')}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
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
    </>
  );
}
