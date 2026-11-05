const { Op } = require('sequelize');
const { Existencia, Producto, Bodega } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, valorFinal } = require('./reglas');

module.exports = crearControladorCrud(Existencia, {
  articulo: 'una existencia',
  orden: [['bodega_id', 'ASC'], ['producto_id', 'ASC']],
  incluir: [
    { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] },
    { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
  ],
  async antesDeGuardar(datos, actual) {
    await verificarReferencias(datos, [
      { campo: 'producto_id', Modelo: Producto, nombre: 'un producto' },
      { campo: 'bodega_id', Modelo: Bodega, nombre: 'una bodega' },
    ]);

    // Un producto aparece una sola vez por bodega
    const producto_id = valorFinal('producto_id', datos, actual);
    const bodega_id = valorFinal('bodega_id', datos, actual);
    const repetida = await Existencia.findOne({
      where: { producto_id, bodega_id, ...(actual ? { id: { [Op.ne]: actual.id } } : {}) },
    });
    if (repetida) {
      throw new HttpError(409, 'Ese producto ya tiene una existencia registrada en la bodega', [
        { campo: 'producto_id', mensaje: `Actualiza la existencia con id ${repetida.id}` },
      ]);
    }
  },
});
