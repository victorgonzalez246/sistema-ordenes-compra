const { Cotizacion, Proveedor, Producto } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');
const { verificarReferencias, valorFinal } = require('./reglas');

module.exports = crearControladorCrud(Cotizacion, {
  articulo: 'una cotización',
  orden: [['fecha', 'DESC'], ['id', 'DESC']],
  incluir: [
    { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] },
    { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre', 'unidad'] },
  ],
  async antesDeGuardar(datos, actual) {
    // Solo se exige proveedor activo al crear o al cambiar de proveedor
    const cambiaProveedor = datos.proveedor_id !== undefined && datos.proveedor_id !== actual?.proveedor_id;
    await verificarReferencias(datos, [
      {
        campo: 'proveedor_id',
        Modelo: Proveedor,
        nombre: 'un proveedor',
        activo: cambiaProveedor ? 'El proveedor está inactivo y no puede cotizar' : undefined,
      },
      { campo: 'producto_id', Modelo: Producto, nombre: 'un producto' },
    ]);

    const fecha = valorFinal('fecha', datos, actual);
    const vigencia = valorFinal('vigencia_hasta', datos, actual);
    if (vigencia < fecha) {
      throw new HttpError(400, 'La vigencia no puede ser anterior a la fecha de la cotización', [
        { campo: 'vigencia_hasta', mensaje: 'Debe ser igual o posterior a la fecha' },
      ]);
    }
  },
});
