const { MetodoPago, Pago } = require('../models');
const crearControladorCrud = require('./crudController');
const { sinDependencias } = require('./reglas');

module.exports = crearControladorCrud(MetodoPago, {
  articulo: 'un método de pago',
  orden: [['nombre', 'ASC']],
  antesDeEliminar: sinDependencias('el método de pago', [
    { Modelo: Pago, campo: 'metodo_pago_id', texto: 'pago(s) registrado(s); márcalo como inactivo' },
  ]),
});
