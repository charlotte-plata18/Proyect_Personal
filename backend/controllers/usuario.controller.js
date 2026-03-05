/**
 * Controlador de usuario ADMIN
 * maneja las gestiones de usuarios de administrador
 * lista de usuarios activa/ y desactiva
 */

/**
 * importar modelos
 */

const Usuario = require ('../models/Usuario');



/**
 * obtener todas los usuarios
 * GET/api/usuairos
 * query params:
 * Activo true/false (filtar por estado)
 * 
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getUsuarios   = async (req, res) => {
    try {
        const {rol, activo, buscar, pagina = 1, limite = 10 }= req.query;

        //Construir los filtros
        const where = {}
        if(rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo === 'true';

        //Busqueda por texto
        if(buscar){
            const {Op} = require('sequelize');
            where[Op.or] = [
                {nombre: { [Op.like]: `%${buscar}%`}},
                {apellido: { [Op.like]: `%${buscar}%`}},
                {email: { [Op.like]: `%${buscar}%`}},
            ];
        }

        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //obtener usuarios sin password
        const {count, row:usuarios} = await Usuario.findAndCountAll({
            where,
            attributes: {exclude: ['password']},
            limit:parseInt(limite),
            offset,
            order:[['createdAt','DESC']]
        });

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                usuarios,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt (limite),
                    totalPaginas: Math.ceil(count / parseInt (limite)),
                }
            }
        })
    }catch (error){
        console.error('Error en getUsuarios:', error),
        res.status(500).json({
            success:false,
            message: 'Error en al obtener el usuario',
            error: message.error
        })
    }
}
/**
 * obtener todas las usuario por id
 * GET/ api/categoria/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getUsuarioById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar categorias con subcategoria y contar productos
        const categoria = await Categoria.findByPk (id,{
            attributes:{exclude: ['password']}
        });
        
        if (!categoria){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrada'
            });
        }


        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                usuario
            }
        });

    } catch (error){
        console.error('Error en getUsuarioById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el usuario',
            error: error.message,
        })
    }
};

/**
 * Crear nuevo usuario
 * POST / api/admin/usuario
 * Body: { nombre, apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearUsuario = async (req, res) =>{
    try{

        const {nombre, apellido, email, password, rol, telefono, direccion} = res.body;
        if(!nombre || !apellido  || !email || !password || !rol) {
            return res.status(400).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password, rol'
            });
        }
        //validar rol
        if (!['cliente', 'auxiliar', 'administradores'].includes(rol)){
            return res.status(400).json({
                success: false,
                message: 'Rol invalido debe ser cliente, auxiliar o administrador'
            });
        }

        //validar email unico
        const usuarioExistente = await Usuario.findOne({where: {email}});
        if (usuarioExistente){
            return res.status(400).json({
                success: false,
                message: `ya existe un usuario con ese email: ${email}`
            });
        }
        
        // crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null,
            direccion: direccion || nukll, // si no se proporciona se establece como null
        });

        // respuesta exitosa
        res.status(201).json({
            success:true,
            message: ' Usuario creado exitosamente',
            data:{
                usuario:nuevoUsuario.tojson // convertir en Json para excluir campos sencibles
            }
        });

    } catch (error){
        console.error('Error en crearUsuario', error);
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message:'Error de validacion',
            errors: error.errors.map(e => e.message)
        
        });
    }
    res.status(500).json({
        success:false,
        message: 'Error al crear categoria',
        error:error.message
    })
}
};

/**
 * Actualiza Usuario
 * PUT/ api/ admin/usuario/:id
 * body:{ nombre, apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaUsuario = async (req, res) =>{
    try{
        const{id} = req.params;
        const {nombre, descripcion} =req.body;

        //buscar usuario
        const categoria = await Categoria.findByPk(id);
        
        if(!categoria) {
            return res.status(404).json({
                success : false,
                message: 'Categoria no encontrada',
            })
        }
        
        // validacion 1 si se camabia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre){
            const categoriaConMismoNombre = await categoria.findOne({ where:{nombre}});
            if ( categoriaConMismoNombre) {
                return res.status(400).json({
                    success:false,
                    message:`ya existe una categoria con el nombre"${nombre}"`,
                });
            }
        } 

        // Actualizar campos
        if (nombre!==undefined) categoria.nombre = nombre;
        if (descripcion!==undefined) categoria.descripcion = descripcion;
        if (activo!==undefined) categoria.activo = activo;

        // guardar cambios
        await categoria.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data:{
                categoria
            }
        });
    }catch (error){
        console.error('Error en actualizar categoria:', error);

        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar categoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar categoria
 * PATCH/api/admin/categorias/:id/estado
 * 
 * Al desactivar una categoria se desacctican tosa las subcategorias relacionadas
 * al desactivar una subcategoria se desactivan todos los productos
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleCategoria = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar categoria
        const categoria = await Categoria.findByPk(Id);

        if(!categoria) {
            return res.status(404).json ({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        
        //Alternaar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        //contar cuantos registros se afectaron
        const subcategoriaAfectadas = await
        Subcategoria.count ({where:{categoriaId:id}
        });

        const productoAfectadas = await producto.count ({where:{categoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Categoria ${nuevoEstado ? 'activada': 'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados:{
                    Subcategoria:
                    subcategoriaAfectadas,
                    productos: productoAfectadas
                }
            }
        });
    } catch (error){
        console.error('Error en toggleCategoria:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categoria/:id
 * Solo permite eliminsr si no tiene subcategorias 
 * ni productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Validacion varifica que no tenga subcategoria
        const subcategorias = await Subcategoria.count({
            where: {categoriaId: id}
        });
         if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria por que tiene ${subcategorias} 
                subcategorias asociadas usa PATCH/api/admin/categoria/:id/ toogle para desactivarla en lugar de eliminarla`
            });
         }
          // Validacion varifica que no tenga productos
        const productos = await Producto.count({
            where: {categoriaId: id}
        });
         if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria por que tiene ${productos} 
                productos asociados usa PATCH/api/admin/categoria/:id/ toogle para desactivarla en lugar de eliminarla`
            });
         }
        
        // Eliminar categoria
            await categoria.destroy();
        // Respuesta exitosa
        res.json({
                success: true,
                message: 'Categoria eliminada exitosamente'
            });
        } catch (error){
        console.error('Error al eliminar categoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al eliminar categoria',
            error: error.message
        });

    }
};

/**
 * Obtener una estadistica de un categoria
 * GET /api/admin/categoria/:id/estadistica
 * retorna
 * Total de subcategorias activas/ incativas
 * total de productos activos / inactivos
 * valor total de inventario 
 * stock total
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getEstadisticaCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //verificar que la categoria exista
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message:'categoria no encontrada'
            });
        }

        //contar subcategorias activas e inactivas
        const totalSubcategorias = await Subcategoria.count({
            where:{categoriaId: id,}
        });
        const subcategoriasActivas = await Subcategoria.count({
            where:{categoriaId: id, activo: true}
        });
        
        //contar productos incativos y activos
        const totalProductos = await Producto.count({
            where:{categoriaId: id}
        });
        const productosActivos = await Producto.count({
            where:{categoriaId: id, activo: true}
        });

        //obtener prodcutos para calcular estadisticas de inventario
        const productos = await Producto.findAll({
            where:{categoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de invetario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock;
        });

        //respuesta exitosa
        res.json({
            success:true,
            data:{
                categoria:{
                    id: categoria.id,
                    nombre: categoria.nombre,
                    activo: categoria.activo,
                },
                estadisticas:{
                    subcategorias: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                    },
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
        console.error('Error en getEstadisticaCategoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener estadisticas de la categoria',
            error: error.message
        })
    }
};


//Exportar todos los controladores
module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizaCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticaCategoria
};