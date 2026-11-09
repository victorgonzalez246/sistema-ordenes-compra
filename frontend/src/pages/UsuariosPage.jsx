import { useCallback } from 'react';
import PaginaCatalogo from '../components/PaginaCatalogo';
import FormularioEntidad from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { TEXTO_ROL } from '../components/PanelAprobacion';
import { useAuth } from '../context/AuthContext';
import { usuariosApi } from '../services/recursos';
import { fuentes } from '../services/fuentes';
import { metricas } from '../services/metricas';

const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const CAMPOS_CREAR = [
  { nombre: 'nombre', etiqueta: 'Nombre completo', tipo: 'texto', requerido: true, max: 100, ancho: 'completo' },
  { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true, max: 120, ancho: 'completo' },
  { nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', requerido: true, max: 72, ayuda: 'Mínimo 8 caracteres', ancho: 'completo' },
];

// Al editar, la contraseña es opcional: vacía significa "no cambiarla"
const CAMPOS_EDITAR = CAMPOS_CREAR.map((c) =>
  c.nombre === 'password' ? { ...c, etiqueta: 'Nueva contraseña', requerido: false, ayuda: 'Déjala vacía para conservar la actual' } : c
);

// Rol y departamento deciden qué órdenes aprueba cada quien; solo la Gerencia General los asigna
const CAMPOS_ROL = [
  {
    nombre: 'rol',
    etiqueta: 'Rol en la matriz de aprobación',
    tipo: 'select',
    defecto: 'solicitante',
    opciones: Object.entries(TEXTO_ROL).map(([valor, texto]) => ({ valor, texto })),
  },
  {
    nombre: 'departamento_id',
    etiqueta: 'Departamento',
    tipo: 'relacion',
    fuente: fuentes.departamento,
    ayuda: 'Una jefatura de área solo aprueba órdenes de su departamento',
  },
];

export default function UsuariosPage() {
  const { usuario } = useAuth();
  const asignaRoles = usuario?.rol === 'gerencia_general';

  // Estable entre renders para que el formulario abierto no se reinicie
  const FormularioUsuario = useCallback(
    (props) => {
      const base = props.inicial.id ? CAMPOS_EDITAR : CAMPOS_CREAR;
      return <FormularioEntidad {...props} campos={asignaRoles ? [...base, ...CAMPOS_ROL] : base} />;
    },
    [asignaRoles]
  );

  const columnas = [
    {
      clave: 'nombre',
      titulo: 'Usuario',
      render: (u) => (
        <>
          <strong>{u.nombre}</strong> {u.id === usuario?.id && <Insignia texto="Tú" clase="estado-aprobada" />}
        </>
      ),
    },
    { clave: 'correo', titulo: 'Correo', render: (u) => <a href={`mailto:${u.correo}`}>{u.correo}</a> },
    {
      clave: 'rol',
      titulo: 'Rol',
      render: (u) => (
        <>
          {TEXTO_ROL[u.rol] ?? u.rol}
          {u.departamento && <div className="texto-suave">{u.departamento.nombre}</div>}
        </>
      ),
    },
    { clave: 'fecha_creacion', titulo: 'Creado', render: (u) => <span className="sin-corte">{fechaHora(u.fecha_creacion)}</span> },
  ];

  return (
    <PaginaCatalogo
      titulo="Usuarios"
      descripcion={`Cuentas que pueden entrar al sistema. Las contraseñas se guardan cifradas y nunca se muestran; no puedes eliminar tu propia cuenta. ${
        asignaRoles ? 'Como Gerencia General, asignas el rol de cada persona en la matriz de aprobación.' : 'Solo la Gerencia General asigna roles.'
      }`}
      singular="Usuario"
      api={usuariosApi}
      metricas={metricas.usuarios}
      columnas={columnas}
      Formulario={FormularioUsuario}
      camposBusqueda={['nombre', 'correo', (u) => TEXTO_ROL[u.rol]]}
      nombreDe={(u) => `${u.nombre} (${u.correo})`}
    />
  );
}
