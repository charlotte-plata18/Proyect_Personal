/**
 * Controlador de productos
 * maneja las operaciones crud activa y/o desactiva productos
 * solo para administrador
 */

/**
 * importar modelos
 */

const Producto = require ('../models/Producto');
const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');

//importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs');



/**
 * obtener todos los productos
 * query params
 * categoriaId: Id de la categoria
 * subcategoriaId: Id de la subcategoria
 * Activo true/false (filtar por estado)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getProductos = async (req, res) => {
    try {
        const {
            subcategoriaId, 
            categoriaId,
            activo, 
            conStock,
            buscar,
            pagina = 1,
            limite = 10 
        }= req.query;

        // construir filtros de consulta
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = {[require('sequelize').Op.gt]: 0};

        // paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        
        // Opciones de consulta
        const opciones = {
            where,
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre']
                }               
            ], 
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        };

        const {count, rows: productos} = await Producto.findAndCountAll(opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: count,
            data: {
                productos,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error){
        console.error('Error en getProductos', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener los Productos',
            error: error.message,
        })
    }
};

/**
 * obtener todos los productos por id
 * GET/ api/admin/producto/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductoById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar prductos con relacion 
        const producto  = await Producto.findByPk (id,{
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre','activo']
                },
                {
                    model : Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre']
                }
            ]
        });
        
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }


        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                producto
            }
        });

    } catch (error){
        console.error('Error en getProductoById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el Producto',
            error: error.message,
        })
    }
};

/**
 * Crear un producto
 * POST / api/admin/producto
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearProducto = async (req, res) =>{
    try {

        const {
            nombre,
            descripcion,
            precio,
            stock,
            categoriaId,
            subcategoriaId
        } = req.body;
        //validacion 1: nombre obligatorio        
        if(!nombre || !precio || !categoriaId || !subcategoriaId  === undefined) {
            return res.status(400).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, precio, categoriaId, subcategoriaId'
            });

        }
 /*        //validar 2 si la categoria existe
         const categoria = await Categoria.findByPk(categoriaId);
         if (!categoria) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId} no existe`
            });
        }
*/
        //valoracion 2 verificar si si la categoria existe y esta activa
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
        if(!categoria) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId} no existe`
            });
        }
        if (!categoria.activo) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoria.nombre} esta inactiva`
            });
        }

        // Validacion 3 verificar que la subcategoria existe y pertenezca a la categoria
        const subcategoria = await Subcategoria.findByPk(subcategoriaId);
        
        if (!subcategoria) {
            return res.status(400).json({
                success:false,
                message: `La subcategoria con id ${subcategoriaId} no existe`
            });
        }
        if (!subcategoria.activo) {
            return res.status(400).json({
                success:false,
                message: `La subcategoria con id ${subcategoria.nombre} esta inactiva`
            });
        }
        if (subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success:false,
                message: `La subcategoria con id ${subcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        }

        //validacion 4 precio y stock
        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success:false,
                message: 'El precio no puede ser negativo'
            });
        }
        if (parseIntstock < 0) {
            return res.status(400).json({
                success:false,
                message: 'El stock no puede ser negativo'
            });
    }

        // crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoriaId:parseInt(categoriaId),
            subcategoriaId: parseInt(subcategoriaId),
            imagen,
            activo: true // por defecto el producto se crea como activo
        });

        //Recargar con relaciones
        await nuevoProducto.reload({
            include:[
                {model: Categoria,
                as: 'categoria',
                attributes: ['id','nombre']},
                {model: Subcategoria,
                as: 'subcategoria',
                attributes: ['id','nombre']}
            ]  
        });

        // respuesta exitosa
        res.status(201).json({
            success:true,
            message: 'Producto creado exitosamente',
            data:{
                producto: nuevoProducto
            }
        });

    } 
    }catch (error){
        console.error('Error en crearProducto:', error);

        // si hubo un error eliminar imagen si se subio una imagen
        if (req.file) {
            const imagenPath = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen:', err);
            }
        }

        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success:false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

/**
 * Actualiza Producto
 * PUT/ api/ admin/ productos/:id
 * body: {nombre, descripcion, categoriaId, subcategoriaId, precio, stock, activo}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaProducto = async (req, res) =>{
    try{
        const{id} = req.params;
        const {
            nombre, 
            descripcion,
            categoriaId, 
            activo,
            stock,
            precio
        } =req.body;

        //buscar producto
        const producto = await Producto.findByPk(id);
        
        if(!producto) {
            return res.status(404).json({
                success : false,
                message: 'Producto no encontrado',
            });
        }
        
        // validacion si se cambia la categoria y sub categoria

        if (categoriaId && categoriaId !== producto.categoriaId) {
            const categoria = await Categoria.findByPk(categoriaId);
            if (!categoria ||!categoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:`Categoria invalida o inactiva`,
                });
            }
        }

        if (subcategoriaId && subcategoriaId !== producto.subcategoriaId) {
            const subcategoria = await Subcategoria.findByPk(subcategoriaId);
            if (!subcategoria ||!subcategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:`Subcategoria invalida o inactiva`,
                });
            }

            const catId = await categoriaId||producto.categoriaId;
            if (!subcategoria.categoriaId !== parseInt(catId)) {
                return res.status(400).json({
                    success:false,
                    message:`la subcategoria mo pertenece a la categoria seleccionada`,
                });
            };

            //validar precio y stock
            if (precio !== undefined && parseFloat(precio) < 0) {
                return res.status(400).json({
                    success:false,
                    message: 'El precio debe ser mayor a 0'
                });
            }

            //manjar imagen
            const imagen = req.file ? req.file.filename : producto.imagen;
            if (req.file ) {
                if (producto.imagen) {
                    const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
                    try {
                        await fs.unlink(rutaImagenAnterior);
                    } catch (err) {
                    console.error('Error al eliminar imagen anterior:', err);}
            }
            producto.imagen = req.file.filename;
        }

            if (stock !== undefined && parseInt(stock) < 0) {
                return res.status(400).json({
                    success:false,
                    message: 'El stock no puede ser negativo'
                });
            }

            if (!nuevaSubcategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message: `La subcategoria con id ${nuevaSubcategoria.nombre} esta inactiva`
                });
            }
        };

        // Actualizar campos
        if (nombre!==undefined) producto.nombre = nombre;
        if (descripcion!==undefined) producto.descripcion = descripcion;
        if (categoriaId!==undefined) producto.categoriaId =  parseInt(categoriaId);
        if (activo!==undefined) producto.activo = activo;
        if (stock!==undefined) producto.stock = parseInt(stock);
        if (precio!==undefined) producto.precio = parseFloat(precio);
        if (subcategoriaId!==undefined) producto.subcategoriaId = parseInt(subcategoriaId);
        // guardar cambios
        await producto.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data:{
                producto
            }
        });
    }catch (error){
        console.error('Error en actualizar producto:', error);
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {                
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen:', err);
            }
        }

        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar producto
 * PATCH/api/admin/produtos/:id/estado
 *
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleProducto = async (req, res) => {
    try{
        const {id} =req.params;

        
        // Buscar Producto
        const producto = await Producto.findByPk(id);

        if(!producto) {
            return res.status(404).json ({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        producto.activo = !producto.activo;
        await producto.save();

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Producto ${producto.activo ? 'activado': 'desactivado'} exitosamente`,
            data:{
                producto
            }
        });

    } catch (error){
        console.error('Error en toggleProducto:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de producto',
            error: error.message
        });
    }
};

/**
 * Eliminar producto    
 * DELETE /api/admin/productos/:id
 * Elinar un producto y su imagen
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarProducto = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar producto
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

            //el hook beforeDestroy se encarga de eliminar la imagen 
            await producto.destroy();

            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }

};


    /**
     * Actualizar stock de un producto
     * 
     * PACH/api/admin/prductos/:id/stock
     * body:{cantidad, operacion:'aumentar' | 'reducir'| 'establecer'}
     * @param {Object} req request express
     * @param {Object} res response express
     */

    const actualizarStock = async (req, res) => {
        try{
            const {id} = req.params;
            const {cantidad, operacion} = req.body;
            
            if (!cantidad || !operacion) {
                return res.status(400).json({
                    success:false,
                    message: 'Se requiere cantidad y operacion'
                });
            }

            const cantidadNUm = parseInt (cantidad);
            if (cantidadNUm < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad no puede ser negativa'
                });
            }

        const producto = await Producto.findByPk(id);
        
        if(!producto) {
            return res.status(404).json({
                success:false,
                message: 'Producto no encontrado'
            });
        }

        let nuevoStock;
        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNUm)
                break;
            case 'reducir':
                if (cantidadNUm > producto.stock) {
                    return res.status(400).json({
                        success:false,
                        message: `No hay sificiente stock, stock actual: ${producto.stock}`
                    });
                }
                nuevoStock = producto.reducirStock(cantidadNUm);
                break;
            case 'establecer':
                nuevoStock = cantidadNUm;
                break;
            default:
                return res.status(400).json({
                    success:false,
                    message: 'Operacion invalida, usa  aumentar, reducir o establecer'
                });
            }

            producto.stock = nuevoStock;
            await producto.save();

            res.json({
                success:true,
                message: `Stock ${operacion === 'aumentar' ? 'aumentado': operacion === 'reducir' ? 'reducido' : 'establecido'} exitosamente`,
                data:{
                    productoId: producto.id,
                    nombre: producto.nombre,
                    stockAnterior: operacion === 'establecer' ? null: 
                    (operacion === 'aumentar' ? producto.stock - cantidadNUm :
                    producto.stock + cantidadNUm),
                    stockActual: producto.stock 
                }
            });

        } catch (error) {
            console.error('Error al actualizarStock:', error);
            res.status(500).json({
                success:false,
                message: 'Error al actualizar stock',
                error: error.message
            });
        }
    };



//Exportar todos los controladores
module.exports = {
    getProductos,
    getProductoById,
    crearProducto,
    actualizaProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock
}