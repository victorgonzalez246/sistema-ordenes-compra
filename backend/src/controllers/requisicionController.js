const { Requisicion, Empleado, Departamento } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias } = require('./reglas');

module.exports = crearControladorCrud(Requisicion, {
  articulo: 'una requisición',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir: [
    {
      model: Empleado,
      as: 'empleado',
      attributes: ['id', 'nombre', 'puesto'],
      include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'nombre'] }],
    },
  ],
  async antesDeGuardar(datos, actual) {
    // Una requisición aprobada o rechazada ya no se modifica
    if (actual && actual.estado !== 'pendiente') {
      throw new HttpError(409, `La requisición está ${actual.estado}: solo se modifica una requisición pendiente`);
    }
    const cambiaEmpleado = datos.empleado_id !== undefined && datos.empleado_id !== actual?.empleado_id;
    await verificarReferencias(datos, [
      {
        campo: 'empleado_id',
        Modelo: Empleado,
        nombre: 'un empleado',
        activo: cambiaEmpleado ? 'El empleado está inactivo y no puede solicitar compras' : undefined,
      },
    ]);
  },
  async antesDeEliminar(requisicion) {
    if (requisicion.estado === 'aprobada') {
      throw new HttpError(409, 'No se puede eliminar una requisición aprobada');
    }
  },
});
