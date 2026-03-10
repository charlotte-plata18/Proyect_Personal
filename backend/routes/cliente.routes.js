/**Rutas del cliente
 * rutas publicas  y para los clientes autenticados
 */

const express = require ( 'express');
const router = express.Router();

//importar los middleware

const {verificarAuth} = require ('../middleware/auth');
const {esCliente} = require ('../middleware/checkRole');

//importar controles
const catalogoController = require ('../controllers/catalogo.controller');
const carritoController = require ('../controllers/carrito.controller');
const pedidoController = require ('../controllers/pedido.controller');
const { vaciarCarrito } = require('../models/Carrito');



 // rutas publicas de catalogo
 //Get /api/catalogo/productos
 router.get ('/catalogo/productos', catalogoController.getProductos);
 //Get /api/catalogo/productos/:id
 router.get ('/catalogo/productos/:id', catalogoController.getProductoById);
//get/api/catalogo/categorias
router.get('/catalogo/categorias', catalogoController.getCategorias);

 //get/api/catalogo/categorias/:id/subcategorias
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);

  //post /api/catalogo/destacados
 router.post ('/categorias/destacados', catalogoController.getProductosDestacados);

 
 // rutas de carrito
 //Get /api/ cliente/carrito
 router.get ('/carrito', carritoController.getCarrito);


  //post /api/ cliente/carrito
 router.post ('/cliente/carrito', verificarAuth, carritoController.agregarAlCarrito);

  //PUT /api/ cliente/carrito/:id
 router.put ('/cliente/carrito/:id', verificarAuth,carritoController.actualizarItemCarrito);

  //delete/api/carrito/cliente
router.delete ('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

  //delete/api/carrito/cliente
  // Elimirnar un item del carrito
router.delete ('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

  //delete/api/carrito/cliente
 // vaciarCarrito
router.delete ('/cliente/carrito/:id', verificarAuth, carritoController.vaciarCarrito);



 // rutas de p -cliente
 
 //POST/api/ cliente/pedidos
router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);

//GET/api/cliente/pedidos/:id
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

//GET/api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);

//PUT/api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);

module.exports = router;



