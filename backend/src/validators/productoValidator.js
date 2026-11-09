const { body } = require('express-validator');
const { idParam, soloCampos, alMenosUnCampo, texto, montoOpcional, referencia, entero, filtroId } = require('./comunes');

const CAMPOS = [
  'codigo', 'nombre', 'unidad', 'precio_ref', 'categoria_id',
  'stock_minimo', 'stock_maximo', 'demanda_promedio', 'demanda_maxima', 'tiempo_entrega',
];

// El punto de reorden y el stock de seguridad no se reciben: se calculan
const calculados = body(['punto_reorden', 'stock_seguridad'])
  .not().exists().withMessage('El punto de reorden y el stock de seguridad se calculan; no se pueden digitar');

function reglas({ opcional }) {
  return [
    calculados,
    texto('codigo', 'El código', 30, { opcional }).toUpperCase(),
    texto('nombre', 'El nombre', 150, { opcional }),
    texto('unidad', 'La unidad', 20, { opcional, femenino: true }),
    montoOpcional('precio_ref', 'El precio de referencia'),
    referencia('categoria_id', 'La categoría', { nulo: true }),
    entero('stock_minimo', 'El stock mínimo', { nulo: true }),
    entero('stock_maximo', 'El stock máximo', { nulo: true }),
    montoOpcional('demanda_promedio', 'La demanda diaria promedio'),
    montoOpcional('demanda_maxima', 'La demanda diaria máxima'),
    entero('tiempo_entrega', 'El tiempo de entrega (días)', { nulo: true }),
  ];
}

module.exports = {
  crearProducto: [soloCampos([...CAMPOS, 'punto_reorden', 'stock_seguridad']), ...reglas({ opcional: false })],
  actualizarProducto: [
    ...idParam,
    soloCampos([...CAMPOS, 'punto_reorden', 'stock_seguridad']),
    alMenosUnCampo,
    ...reglas({ opcional: true }),
  ],
  filtrosProducto: [filtroId('categoria_id')],
  idProducto: idParam,
};
