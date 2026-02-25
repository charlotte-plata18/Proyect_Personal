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
 *
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
        
        // Actualizar categoria si se proporciona un nuevo categoriaId
        if (subcategoriaId && subcategoriaId !== producto.subcategoriaId) {
            const nuevaSubcategoria = await Subcategoria.findByPk(subcategoriaId);
            if (!nuevaSubcategoria) {
                return res.status(400).json({
                    success:false,
                    message:`La subcategoria con id ${subcategoriaId} no existe`,
                });
            }

            if (!nuevaSubcategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message: `La subcategoria con id ${nuevaSubcategoria.nombre} esta inactiva`
                });
            }
        };

        // valdacion si se cambia el nombre que no exita la categoria con el mismo nombre
        if (nombre && nombre !== producto.nombre) {
            const subcategoriaFinal = subcategoriaId || producto.subcategoriaId; // usar el nuevo subcategoriaId si se proporciona, de lo contrario usar el existente
            const productoConMismoNombre = await Producto.findOne({
                where: {
                    nombre,
                    subcategoriaId: subcategoriaFinal
                }
            });

            if (productoConMismoNombre) {
                return res.status(400).json({
                    success:false,
                    message:`Ya existe un producto con el nombre "${nombre}" en la subcategoria ${subcategoriaFinal}`
                });
            }
        }

        // Actualizar campos
        if (nombre!==undefined) subcategoria.nombre = nombre;
        if (descripcion!==undefined) subcategoria.descripcion = descripcion;
        if (descripcion!==undefined) subcategoria.descripcion = descripcion;
        if (categoriaId!==undefined) subcategoria.categoriaId = categoriaId;
        if (activo!==undefined) subcategoria.activo = activo;

        // guardar cambios
        await subcategoria.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Subategoria actualizada exitosamente',
            data:{
                subcategoria
            }
        });
    }catch (error){
        console.error('Error en actualizar subcategoria:', error);

        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar subcategoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar subcategoria
 * PATCH/api/admin/subcategorias/:id/estado
 * 
 * Al desactivar una subcategoria se desactican todos los productos
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleSubcategoria = async (req, res) => {
    try{
        const {id} =req.params;

        
        // Buscar Subcategoria
        const subcategoria = await Subcategoria.findByPk(id);

        if(!subcategoria) {
            return res.status(404).json ({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }
        //Alternaar estado activo
        const nuevoEstado = !subcategoria.activo;
        subcategoria.activo = nuevoEstado;

        // Guardar cambios
        await subcategoria.save();
        //contar cuantos registros se afectaron

        const productoAfectadas = await Producto.count ({where:{subcategoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Subcategoria ${nuevoEstado ? 'activada': 'desactivada'} exitosamente`,
            data:{
                subcategoria,
                productos: productoAfectadas

            }
        });
    } catch (error){
        console.error('Error en toggleSubcategoria:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de subcategoria',
            error: error.message
        });
    }
};

/**
 * Eliminar subcategoria
 * DELETE /api/admin/subcategoria/:id
 * Solo permite eliminar productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

          // Validacion varifica que no tenga productos
        const productos = await Producto.count({
            where: {subcategoriaId: id}
        });
         if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la subcategoria por que tiene ${productos} 
                productos asociados usa PATCH/api/admin/subcategoria/:id/ toogle para desactivarla en lugar de eliminarla`
            });
         }
        
        // Eliminar subcategoria
            await subcategoria.destroy();
        // Respuesta exitosa
        res.json({
                success: true,
                message: 'Subcategoria eliminada exitosamente'
            });
        } catch (error){
        console.error('Error al eliminar subcategoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al eliminar subcategoria',
            error: error.message
        });

    }
};

/**
 * Obtener una estadistica de un subcategoria
 * GET /api/admin/subcategoria/:id/estadistica
 * retorna
 *  total de subcategoria activos / inactivos
 * total de productos activos / inactivos
 * valor total de inventario 
 * stock total
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getEstadisticaSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //verificar que la subcategoria exista
        const subcategoria = await Subcategoria.findByPk(id[{
            include:[{
                model: Categoria,
                as: 'categoria',
                attributes: ['id','nombre']
            }]
        }]);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message:'subcategoria no encontrada'
            });
        }

        //contar productos incativos y activos
        const totalProductos = await Producto.count({
            where:{subcategoriaId: id}
        });
        const productosActivos = await Producto.count({
            where:{subcategoriaId: id, activo: true}
        });

        //obtener productos para calcular estadisticas de inventario
        const productos = await Producto.findAll({
            where:{subcategoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de invetario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
        });

        //respuesta exitosa
        res.json({
            success:true,
            data:{
                subcategoria:{
                    id: subcategoria.id,
                    nombre: subcategoria.nombre,
                    activo: subcategoria.activo,
                    categoria: subcategoria.categoria
                },
                estadisticas:{
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2) // quitar decimales 
                    }
                }
            }
        });
    }catch (error){
        console.error('Error en getEstadisticaSubcategoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener estadisticas de la subcategoria',
            error: error.message
        })
    }
};


//Exportar todos los controladores
module.exports = {
    getSubcategorias,
    getSubcategoriasById,
    crearSubcategoria,
    actualizaSubcategoria,
    toggleSubcategoria, 
    eliminarSubcategoria,
    getEstadisticaSubcategoria    
};