const { Bodega, Empleado, Existencia, Recepcion } = require('../models');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, sinDependencias } = require('./reglas');

module.exports = crearControladorCrud(Bodega, {
  articulo: 'una bodega',
  orden: [['nombre', 'ASC']],
  incluir: [{ model: Empleado, as: 'responsable', attributes: ['id', 'nombre', 'puesto'] }],
  async antesDeGuardar(datos) {
    await verificarReferencias(datos, [
      { campo: 'responsable_id', Modelo: Empleado, nombre: 'un empleado', activo: 'El responsable está inactivo' },
    ]);
  },
  antesDeEliminar: sinDependencias('la bodega', [
    { Modelo: Existencia, campo: 'bodega_id', texto: 'producto(s) en existencia' },
    { Modelo: Recepcion, campo: 'bodega_id', texto: 'recepción(es) registrada(s); márcala como inactiva' },
  ]),
});
