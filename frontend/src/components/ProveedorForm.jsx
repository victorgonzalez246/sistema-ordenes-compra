import Campo from './Campo';
import PieFormulario from './PieFormulario';
import { useFormulario } from '../hooks/useFormulario';
import { textoONulo } from '../utils/formato';

export default function ProveedorForm({ inicial, onGuardar, onCancelar }) {
  const { valores, enlazar, errores, errorGeneral, enviando, enviar } = useFormulario({
    razon_social: inicial.razon_social ?? '',
    cedula_juridica: inicial.cedula_juridica ?? '',
    email: inicial.email ?? '',
    telefono: inicial.telefono ?? '',
    activo: inicial.activo ?? true,
  });

  function alEnviar(e) {
    e.preventDefault();
    enviar(() =>
      onGuardar({
        razon_social: valores.razon_social.trim(),
        cedula_juridica: valores.cedula_juridica.trim(),
        email: valores.email.trim(),
        telefono: textoONulo(valores.telefono),
        activo: valores.activo,
      })
    );
  }

  const activo = enlazar('activo');

  return (
    <form onSubmit={alEnviar}>
      <div className="modal-cuerpo">
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="rejilla-form">
          <Campo etiqueta="Razón social" requerido error={errores.razon_social} className="ancho-completo">
            <input {...enlazar('razon_social')} required maxLength={150} autoFocus />
          </Campo>
          <Campo etiqueta="Cédula jurídica" requerido error={errores.cedula_juridica} ayuda="Formato: 3-101-123456">
            <input {...enlazar('cedula_juridica')} required maxLength={12} pattern="[0-9]-[0-9]{3}-[0-9]{6}" title="Formato: 3-101-123456" placeholder="3-101-123456" />
          </Campo>
          <Campo etiqueta="Teléfono" error={errores.telefono}>
            <input {...enlazar('telefono')} type="tel" maxLength={30} placeholder="+506 2222-3333" />
          </Campo>
          <Campo etiqueta="Email" requerido error={errores.email} className="ancho-completo">
            <input {...enlazar('email')} type="email" required maxLength={120} />
          </Campo>
          <label className="interruptor ancho-completo">
            <input type="checkbox" name={activo.name} checked={valores.activo} onChange={activo.onChange} />
            <span>
              Proveedor activo
              <small className="texto-suave"> · los inactivos no pueden recibir órdenes nuevas</small>
            </span>
          </label>
        </div>
      </div>
      <PieFormulario enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
