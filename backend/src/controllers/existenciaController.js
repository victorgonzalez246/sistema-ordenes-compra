const { Op } = require('sequelize');
const { Existencia, Producto, Bodega, Movimiento } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias } = require('./reglas');
const { stockPorBodega } = require('../services/inventario');

/**
 * Existencias: resumen del stock por material y bodega.
 * La cantidad la mantiene services/inventario.js con cada movimiento; aquí solo se
 * administra el mínimo de cada bodega.
 */
module.exports = crearControladorCrud(Existencia, {
  articulo: 'una existencia',
  orden: [['bodega_id', 'ASC'], ['producto_id', 'ASC']],
  incluir: [
    { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] },
    { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
  ],
  async antesDeGuardar(datos, actual) {
    if (actual) return; // al actualizar solo cambia el mínimo

    await verificarReferencias(datos, [
      { campo: 'producto_id', Modelo: Producto, nombre: 'un producto' },
      { campo: 'bodega_id', Modelo: Bodega, nombre: 'una bodega' },
    ]);

    // Un producto aparece una sola vez por bodega
    const repetida = await Existencia.findOne({ where: { producto_id: datos.producto_id, bodega_id: datos.bodega_id } });
    if (repetida) {
      throw new HttpError(409, 'Ese producto ya tiene una existencia registrada en la bodega', [
        { campo: 'producto_id', mensaje: `Actualiza la existencia con id ${repetida.id}` },
      ]);
    }

    // Si ya hubo movimientos en esa bodega, la cantidad arranca con su saldo
    const [fila] = await stockPorBodega({ producto_id: datos.producto_id, bodega_id: datos.bodega_id });
    datos.cantidad = fila ? fila.cantidad : 0;
  },
  async antesDeEliminar(existencia) {
    const movimientos = await Movimiento.count({
      where: {
        producto_id: existencia.producto_id,
        [Op.or]: [{ bodega_origen_id: existencia.bodega_id }, { bodega_destino_id: existencia.bodega_id }],
      },
    });
    if (movimientos > 0) {
      throw new HttpError(409, `No se puede eliminar la existencia: tiene ${movimientos} movimiento(s) que la respaldan`);
    }
  },
});
