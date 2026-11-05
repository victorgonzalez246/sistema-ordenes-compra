const { Op } = require('sequelize');
const { ContactoProveedor, Proveedor } = require('../models');
const crearControladorCrud = require('./crudController');
const { verificarReferencias } = require('./reglas');

module.exports = crearControladorCrud(ContactoProveedor, {
  articulo: 'un contacto',
  orden: [['proveedor_id', 'ASC'], ['principal', 'DESC'], ['nombre', 'ASC']],
  incluir: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }],
  async antesDeGuardar(datos) {
    await verificarReferencias(datos, [{ campo: 'proveedor_id', Modelo: Proveedor, nombre: 'un proveedor' }]);
  },
  // Cada proveedor tiene un solo contacto principal
  async despuesDeGuardar(contacto) {
    if (contacto.principal) {
      await ContactoProveedor.update(
        { principal: false },
        { where: { proveedor_id: contacto.proveedor_id, id: { [Op.ne]: contacto.id } } }
      );
    }
  },
});
