const { Empleado, Departamento, Requisicion, Recepcion } = require('../models');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, sinDependencias } = require('./reglas');

module.exports = crearControladorCrud(Empleado, {
  articulo: 'un empleado',
  orden: [['nombre', 'ASC']],
  incluir: [{ model: Departamento, as: 'departamento', attributes: ['id', 'nombre', 'centro_costo'] }],
  async antesDeGuardar(datos) {
    await verificarReferencias(datos, [
      { campo: 'departamento_id', Modelo: Departamento, nombre: 'un departamento' },
    ]);
  },
  antesDeEliminar: sinDependencias('el empleado', [
    { Modelo: Requisicion, campo: 'empleado_id', texto: 'requisición(es) registrada(s); márcalo como inactivo' },
    { Modelo: Recepcion, campo: 'empleado_id', texto: 'recepción(es) registrada(s); márcalo como inactivo' },
  ]),
});
