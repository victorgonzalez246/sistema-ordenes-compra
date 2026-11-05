import PaginaCatalogo from '../components/PaginaCatalogo';
import FormularioEntidad from '../components/FormularioEntidad';
import Insignia from '../components/Insignia';
import { useAuth } from '../context/AuthContext';
import { usuariosApi } from '../services/recursos';
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

function FormularioUsuario(props) {
  return <FormularioEntidad {...props} campos={props.inicial.id ? CAMPOS_EDITAR : CAMPOS_CREAR} />;
}

export default function UsuariosPage() {
  const { usuario } = useAuth();

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
    { clave: 'fecha_creacion', titulo: 'Creado', render: (u) => <span className="sin-corte">{fechaHora(u.fecha_creacion)}</span> },
  ];

  return (
    <PaginaCatalogo
      titulo="Usuarios"
      descripcion="Cuentas que pueden entrar al sistema. Las contraseñas se guardan cifradas y nunca se muestran; no puedes eliminar tu propia cuenta."
      singular="Usuario"
      api={usuariosApi}
      metricas={metricas.usuarios}
      columnas={columnas}
      Formulario={FormularioUsuario}
      camposBusqueda={['nombre', 'correo']}
      nombreDe={(u) => `${u.nombre} (${u.correo})`}
    />
  );
}
