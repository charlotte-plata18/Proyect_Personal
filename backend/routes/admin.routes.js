/**Rutas del administrador
 * agrupas tods las rutas de gestion del admin
 */

const express = require ( 'express');
const router = express.Router();

//importar los middleware

const {verificarAuth} = require ('../middleware/auth');
const {esAministrador, esAdminOAuxiliar, soloAdiministrador} = require ('../middleware/checkRole');

//importar configuracion de multer para la subida de imagenes 
const {update} = require ('../config/multer');

//importar controles

const categoriaController = require ('../controllers/categoria.controller');
const subcategoriaController = require ('../controllers/subcategoria.controller');
const usuarioController = require ('../controllers/usuario.controller');
const productoController = require ('../controllers/productos.controller');
const pedidoController = require ('../controllers/pedido.controller');



 // restriccion de acceso de las rutas del admin
 router.use (verificarAuth, esAdminOAuxiliar);

 /**
  * ========================================
  * RUTAS DEL CONTROLADOR: categoriaController
  * ========================================
  */

 // getCategorias - Obtener todas las categorías
 router.get ('/categorias', categoriaController.getCategorias);

 // getCategoriasById - Obtener categoría por ID
 router.get('/categorias/:id', categoriaController.getCategoriasById);

 // crearCategoria - Crear nueva categoría
 router.post ('/categorias', categoriaController.crearCategoria);

 // actualizaCategoria - Actualizar categoría
 router.put ('/categorias/:id', categoriaController.actualizaCategoria);

 // toggleCategoria - Activar/Desactivar categoría
 router.patch ('/categorias/:id/toggle', categoriaController.toggleCategoria);

 // eliminarCategoria - Eliminar categoría
 router.delete ('/categorias/:id', soloAdiministrador, categoriaController.eliminarCategoria);

 // getEstadisticaCategoria - Obtener estadísticas de categoría
 router.get('/categorias/:id/stats', categoriaController.getEstadisticaCategoria);

 /**
  * ========================================
  * RUTAS DEL CONTROLADOR: subcategoriaController
  * ========================================
  */

 // getSubcategorias - Obtener todas las subcategorías
 router.get ('/subcategorias', subcategoriaController.getSubcategorias);

 // getSubcategoriasById - Obtener subcategoría por ID
 router.get('/subcategorias/:id', subcategoriaController.getSubcategoriasById);

 // crearSubcategoria - Crear nueva subcategoría
 router.post ('/subcategorias', subcategoriaController.crearSubcategoria);

 // actualizaSubcategoria - Actualizar subcategoría
 router.put ('/subcategorias/:id', subcategoriaController.actualizaSubcategoria);

 // toggleSubcategoria - Activar/Desactivar subcategoría
 router.patch ('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

 // eliminarSubcategoria - Eliminar subcategoría
 router.delete ('/subcategorias/:id', soloAdiministrador, subcategoriaController.eliminarSubcategoria);

 // getEstadisticaSubcategoria - Obtener estadísticas de subcategoría
 router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticaSubcategoria);

 /**
  * ========================================
  * RUTAS DEL CONTROLADOR: usuarioController
  * ========================================
  */

 // getUsuarios - Obtener todos los usuarios
 router.get ('/usuario', usuarioController.getUsuarios);

 // getUsuarioById - Obtener usuario por ID
 router.get('/usuario/:id', usuarioController.getUsuarioById);

 // crearUsuario - Crear nuevo usuario
 router.post ('/usuario', soloAdiministrador, usuarioController.crearUsuario);

 // actualizaUsuario - Actualizar usuario
 router.put ('/usuario/:id', usuarioController.actualizaUsuario);

 // toggleUsuario - Activar/Desactivar usuario
 router.patch ('/usuario/:id/toggle', soloAdiministrador, usuarioController.toggleUsuario);

 // eliminarUsuario - Eliminar usuario
 router.delete ('/usuario/:id', soloAdiministrador, usuarioController.eliminarUsuario);

 // getEstadisticaUsuarios - Obtener estadísticas de usuarios
 router.get('/usuario/:id/stats', usuarioController.getEstadisticaUsuarios);

 /**
  * ========================================
  * RUTAS DEL CONTROLADOR: productoController
  * ========================================
  */

 // getProductos - Obtener todos los productos
 router.get ('/producto', productoController.getProductos);

 // getProductoById - Obtener producto por ID
 router.get('/producto/:id', productoController.getProductoById);

 // crearProducto - Crear nuevo producto
 router.post('/productos', productoController.crearProducto);

 // actualizaProducto - Actualizar producto
 router.put('/productos/:id', productoController.actualizaProducto);

 // toggleProducto - Activar/Desactivar producto
 router.patch('/productos/:id/toggle', productoController.toggleProducto);

 // eliminarProducto - Eliminar producto
 router.delete('/productos/:id', soloAdiministrador, productoController.eliminarProducto);

 // actualizarStock - Actualizar stock del producto
 router.get('/productos/:id/stocks', productoController.actualizarStock);

 /**
  * ========================================
  * RUTAS DEL CONTROLADOR: pedidoController
  * ========================================
  */

 // crearPedido - Crear nuevo pedido
 router.post('/pedidos', pedidoController.crearPedido);

 // getMisPedidos - Obtener mis pedidos
 router.get ('/pedidos/mios', pedidoController.getMisPedidos);

 // getPedidoById - Obtener pedido por ID
 router.get('/pedido/:id', pedidoController.getPedidoById);

 // cancelarPedido - Cancelar pedido
 router.patch('/pedidos/:id/cancelar', pedidoController.cancelarPedido);

 // getAllPedidos - Obtener todos los pedidos (admin)
 router.get ('/pedidos', pedidoController.getAllPedidos);

 // actualizarEstadoPedido - Actualizar estado del pedido
 router.put('/pedidos/:id', pedidoController.actualizarEstadoPedido);

 // getEstadisticasPedidos - Obtener estadísticas de pedidos
 router.get ('/pedidos/estadisticas', pedidoController.getEstadisticasPedidos);
module.exports = router;