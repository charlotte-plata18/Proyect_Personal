/**
 * Controlador de productos
 * maneja las operaciones crud activa y/o desactiva productos
 * solo para administrador
 */

/**
 * importar modelos
 */

const Producto = require ('../models/Producto');
const Subcategoria = require ('../models/Subcategoria');
const Categoria = require ('../models/Categoria');



/**
 * obtener todos los productos
 * query params
 * categoriaId: Id de la categoria
 * subcategoriaId: Id de la subcategoria
 * Activo true/false (filtar por estado)
 * incluir categoria true / false (incluir categorias relacionadas)
 * incluir subcategoria true / false (incluir subcategorias relacionadas)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getProductos = async (req, res) => {
    try {
        const {subcategoriaId,activo, incluirSubategoria }= req.query;
        
        // Opciones de consulta
        const opciones = {
            order:[['nombre', 'ASC']] // ordenar de manera alfabetica

        };

        //filtro
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !==undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }
        

        // incluir categorias si se solicita

        if (incluirCategorias === 'true'){
            opciones.include == [{
                model: Categoria,
                as: 'categoria', //campos del alias para la relacion
                attributes: ['id','nombre', 'activo'] // campos de incluir de la categoria
            }]
        };

        //Obtener subcategorias
        const subcategorias = await Subcategoria.findAll
        (opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: subcategorias.length,
            data:{
                subcategorias
            }

        });
    } catch (error){
        console.error('Error en getSubcategorias', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener las Subcategorias',
            error: error.message,
        })
    }
};

/**
 * obtener todas las subcategorias por id
 * GET/ api/subcategoria/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriasById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar subcategorias con categoria y contar productos
        const subcategoria = await Subcategoria.findByPk (id,{
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre','activo']
                },
                {
                    model : Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });
        
        if (!subcategoria){
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //agregar contador de productos
        const subcategoriaJSON = subcategoria.toJSON();
        subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
        delete subcategoriaJSON.productos;// no enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                subcategoria: subcategoriaJSON
            }
        });

    } catch (error){
        console.error('Error en getSubcategoriaById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la Subcategoria',
            error: error.message,
        })
    }
};

/**
 * Crear una subcategoria
 * POST / api/admin/subcategoria
 * Body: { nombre,descripcion,categoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearSubcategoria = async (req, res) =>{
    try{

        const {nombre,descripcion,categoriaId} = req.body;
        //validacion 1: nombre obligatorio        
        if(!nombre || !categoriaId) {
            return res.status(400).json({
                success:false,
                message: 'El nombre y la categoria son requeridos'
            });

        }
         //validar 2 si la categoria existe
         const categoria = await Categoria.findByPk(categoriaId);
         if (!categoria) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId} no existe`
            });
        }

        //valoracion 3 si la categoria esta activa
        if(!categoria.activo) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId.nombre} esta  inactiva`
            })
        }

        // Validacion 4 verificar que el nombre no exista una subcategoria con el mismos nombre
        const subcategoriaExistente = await Subcategoria.findOne({where: nombre, categoriaId});
        if (subcategoriaExistente){
            return res.status(400).json({
                success:false,
                message: `Ya existe una subcategoria con el nombre "${nombre}"`
            }); 
        }

        // crear subcategoria
        const nuevaSubcategoria = await Subcategoria.create({
            nombre,
            descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
            activo:true,
            categoriaId
        });

        //obtener subcategoria  de los datos de la categoria
        const subcategoriaConCategoria = await Subcategoria.findByPk(nuevaSubCategoria.id,{
            include:{
                model: Categoria,
                as: 'categoria',
                attributes: ['id','nombre']
            }
        });

        //Respuesta exitosa
        res.status(201).json({
            success:true,
            message: ' Subcategoria creada exitosamente',
            data:{
                subcategoria: subcategoriaConCategoria
            }
        });
    } catch (error){
        console.error('Error en crearSubcategoria:', error);
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message:'Error de validacion',
            errors: error.errors.map(e => e.message)
        
        });
    }
    res.status(500).json({
        success:false,
        message: 'Error al crear subcategoria',
        error:error.message
    })
}
};

/**
 * Actualiza Subcategoria
 * PUT/ api/ admin/ subcategoria/:id
 * body:{ nombre, descripcion, categoriaId, activo}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaSubcategoria = async (req, res) =>{
    try{
        const{id} = req.params;
        const {nombre, descripcion,categoriaId, activo} =req.body;

        //buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);
        
        if(!subcategoria) {
            return res.status(404).json({
                success : false,
                message: 'Subcategoria no encontrada',
            });
        }
        
        // Actualizar categoria si se proporciona un nuevo categoriaId
        if (categoriaId && categoriaId !== subcategoria.categoriaId) {
            const nuevaCategoria = await Categoria.findByPk(categoriaId);
            if (!nuevaCategoria) {
                return res.status(400).json({
                    success:false,
                    message:`La categoria con id ${categoriaId} no existe`,
                });
            }

            if (!nuevaCategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message: `La categoria con id ${nuevaCategoria.nombre} esta inactiva`
                });
            }
        };

        // valdacion si se cambia el nombre que no exita la categoria con el mismo nombre
        if (nombre && nombre !== subcategoria.nombre) {
            const categoriafinal = categoriaId || subcategoria.categoriaId; // usar el nuevo categoriaId si se proporciona, de lo contrario usar el existente
            const subcategoriaConMismoNombre = await Subcategoria.findOne({
                where: {
                    nombre,
                    categoriaId: categoriafinal
                }
            });

            if (subcategoriaConMismoNombre) {
                return res.status(400).json({
                    success:false,
                    message:`Ya existe una subcategoria con el nombre "${nombre}" en la categoria `
                });
            }
        }

        // Actualizar campos
        if (nombre!==undefined) subcategoria.nombre = nombre;
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

        //obtener prodcutos para calcular estadisticas de inventario
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