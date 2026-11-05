const { HttpError } = require('../middlewares/errorHandler');

/**
 * Comprueba que los ids recibidos apunten a registros existentes.
 * Solo revisa los campos que llegaron en la petición.
 * @param datos       cuerpo validado
 * @param referencias [{ campo, Modelo, nombre, activo }] nombre: "un departamento";
 *                    activo: mensaje si el registro existe pero está inactivo
 * @returns mapa { campo: registro } con los registros encontrados
 */
async function verificarReferencias(datos, referencias) {
  const errores = [];
  const encontrados = {};

  for (const { campo, Modelo, nombre, activo } of referencias) {
    const id = datos[campo];
    if (id === undefined || id === null) continue;

    const registro = await Modelo.findByPk(id);
    if (!registro) {
      errores.push({ campo, mensaje: `No existe ${nombre} con id ${id}` });
    } else if (activo && registro.activo === false) {
      errores.push({ campo, mensaje: activo });
    } else {
      encontrados[campo] = registro;
    }
  }

  if (errores.length) throw new HttpError(400, 'Los datos hacen referencia a registros no válidos', errores);
  return encontrados;
}

/**
 * Devuelve un antesDeEliminar que impide borrar un registro con dependencias.
 * @param nombre        "la categoría"
 * @param dependencias  [{ Modelo, campo, texto }] texto: "producto(s) asociado(s)"
 */
function sinDependencias(nombre, dependencias) {
  return async (registro) => {
    for (const { Modelo, campo, texto } of dependencias) {
      const cantidad = await Modelo.count({ where: { [campo]: registro.id } });
      if (cantidad > 0) {
        throw new HttpError(409, `No se puede eliminar ${nombre}: tiene ${cantidad} ${texto}`);
      }
    }
  };
}

// Valor final de un campo al actualizar: el nuevo si llegó, si no el actual
function valorFinal(campo, datos, actual) {
  return datos[campo] !== undefined ? datos[campo] : actual?.[campo];
}

const colones = (n) =>
  `₡${Number(n).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const redondear = (n) => Math.round(n * 100) / 100;

module.exports = { verificarReferencias, sinDependencias, valorFinal, colones, redondear };
