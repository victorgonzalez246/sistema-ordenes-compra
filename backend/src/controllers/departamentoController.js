const { Departamento, OrdenCompra, Empleado } = require('../models');
const { HttpError } = require('../middlewares/errorHandler');
const crearControladorCrud = require('./crudController');

module.exports = crearControladorCrud(Departamento, {
  articulo: 'un departamento',
  orden: [['nombre', 'ASC']],
  async antesDeEliminar(departamento) {
    const ordenes = await OrdenCompra.count({ where: { departamento_id: departamento.id } });
    if (ordenes > 0) {
      throw new HttpError(
        409,
        `No se puede eliminar el departamento: tiene ${ordenes} orden(es) de compra asociada(s)`
      );
    }
    const empleados = await Empleado.count({ where: { departamento_id: departamento.id } });
    if (empleados > 0) {
      throw new HttpError(409, `No se puede eliminar el departamento: tiene ${empleados} empleado(s) asignado(s)`);
    }
  },
});
