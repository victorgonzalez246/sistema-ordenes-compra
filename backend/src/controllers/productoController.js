const { sequelize, Producto, Categoria, DetalleOrden, Existencia, Cotizacion, Movimiento } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, sinDependencias, valorFinal } = require('./reglas');
const { evaluarAlerta } = require('../services/inventario');

// Pares que deben ser coherentes: el máximo no puede quedar por debajo del mínimo
const PARES = [
  ['demanda_maxima', 'demanda_promedio', 'La demanda máxima no puede ser menor que la demanda promedio'],
  ['stock_maximo', 'stock_minimo', 'El stock máximo no puede ser menor que el stock mínimo'],
];

module.exports = crearControladorCrud(Producto, {
  articulo: 'un producto',
  orden: [['codigo', 'ASC']],
  incluir: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
  async antesDeGuardar(datos, actual) {
    await verificarReferencias(datos, [{ campo: 'categoria_id', Modelo: Categoria, nombre: 'una categoría' }]);

    const errores = [];
    for (const [mayor, menor, mensaje] of PARES) {
      const a = valorFinal(mayor, datos, actual);
      const b = valorFinal(menor, datos, actual);
      if (a != null && b != null && Number(a) < Number(b)) errores.push({ campo: mayor, mensaje });
    }
    if (errores.length) throw new HttpError(400, 'Los parámetros de inventario no son coherentes', errores);
  },
  // Si cambian la demanda o el tiempo de entrega, cambia el punto de reorden: se revisa la alerta
  async despuesDeGuardar(producto) {
    await sequelize.transaction((transaction) => evaluarAlerta(producto, { transaction }));
  },
  antesDeEliminar: sinDependencias('el producto', [
    { Modelo: DetalleOrden, campo: 'producto_id', texto: 'línea(s) en órdenes de compra' },
    { Modelo: Movimiento, campo: 'producto_id', texto: 'movimiento(s) de inventario' },
    { Modelo: Existencia, campo: 'producto_id', texto: 'existencia(s) en bodegas' },
    { Modelo: Cotizacion, campo: 'producto_id', texto: 'cotización(es) registrada(s)' },
  ]),
});
