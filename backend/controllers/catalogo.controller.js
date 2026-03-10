/**
 * Controlador de catalogo
 * permite ver lo productossin iniciar sesion
 * solo para administrador
 */

/**
 * importar modelos
 */

const Producto = require ('../models/Producto');
const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');


/**
 * obtener todos los productos al publico
 * Get/api/catalogo/productos
 * query params
 * categoriaId: Id de la categoria
 * subcategoriaId: Id de la subcategoria
 * preciomin, preciomax, rango de precio nombre reciente
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 * solo muestra los productos y con stock activo
 */

const getProductos = async (req, res) => {
    try {
        const {
            subcategoriaId, 
            categoriaId,
            buscar,
            precioMin,
            precioMax,
            orden = 'reciente',
            pagina = 1,
            limite = 12
        }= req.query;
        const {Op} = require('sequelize');

        //filtros base solo para productos activos y con stock
        const where = {
            activo:true,
            stock: {[Op.gte]: 0}
        };
        //filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;

        //Busqueda de texto
        if(buscar){
            where [Op.or] =[
                {nombre: {[Op.like]: `%${buscar}%`}},
                {descripcion: {[Op.like]: `%${buscar}%`}}, // permite buscar por nombre o descripcion
            ];
        }

        //filtro por rango de precio
        if(precioMin && precioMax){
            where.precio = {};
            if (precioMin) where.precio[Op.gte] =
            parseFloat(precioMin);
            if (precioMax) where.precio[Op.lte] =
            parseFloat(precioMax);
        }

        //ordenamiento
        let order;
        switch (orden){
            case '´precio_asc':
                order = [['precio', 'ASC']];
                break;
            case '´precio_desc':
                order = [['precio', 'DESC']];
                break;
            case '´nombre':
                order = [['nombre', 'ASC']];
                break;
            case '´reciente':
                order = [['createdAt', 'DESC']];
                break;
        }

        // paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        
        // consulta de productos

        const opciones = {count, rows: productos} = await Producto.findAndCountAll({
            where,
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre'], 
                    where: {activo: trur}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre'],
                    where: {activo: trur}
                }               
            ], 
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        });


        // respuesta exitosa
        res.json({
            success: true,
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
        
        // Buscar prductos con sctivo y stock
        const producto  = await Producto.findOne ({
            where:{
                id,
                activo: true
            },
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre','activo'],
                    
                },
                {
                    model : Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre'],
                    where:{activo: true}
                }
            ]
        });
        
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o no disponible'
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
 * obtener todos los productos por id
 * GET/ api/admin/producto/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getCategorias = async (req, res) => {
    try {
        const {Op}= require ('sequelize');
        
        // Buscar categoria activasa 
        const categoria  = await Categoria.findOne ({
            where:{activo: true},
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //para cada categoria contar productos activos con stock
        const CategoriasConConteo = await Promise.all(
            categorias.map(async ( categoria) =>{
                const TotalProductos = await Producto.count ({
                    where:{
                        categoriaId: categoria.id,
                        activo: true,
                        stock: {[Op.gt]: 0}

                    }
                });
                return{
                    ...categoria.toJSON(),
                    TotalProductos
                };
            })
        )
        

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                categorias:CategoriasConConteo
            }
        });

    } catch (error){
        console.error('Error en getCategoria', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la categoria',
            error: error.message,
        })
    }
};

/**
 * obtener subcategorias por categorias
 * GET/ api/admin/producto/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriasPorCategoria = async (req, res) => {
    try {
        const {id} = req.params;
        const {Op} = require ('sequelize');

        //Verificar que la categoria exista
        const categoria = await Categoria. findOne({
            where:{id, activo: true},
        });
        if (!categoria) {
            return res.status(404).json({
                success:false,
                message: 'catengoria no encontrada'
            })
        }
        
        // Buscar subcategoria activas
        const subcategorias  = await Subcategoria.findOne ({
            where:{
                categoriaId: id,
                activo: true
            },
            attributes: ['id', 'nombre','descripcion'],
            order: [['nombre', 'ASC']]
        });

        //para cada subcategoria contar productos activos con stock
        const SubcategoriasConConteo = await Promise.all(
            subcategorias.map(async ( subcategoria) =>{
                const totalProductos = await Producto.count ({
                    where:{
                        subcategoriaId: subcategoria.id,
                        activo: true,
                        stock: {[Op.gt]: 0}

                    }
                });
                return{
                    ...subcategoria.toJSON(),
                    totalProductos
                };
            })
        )
        

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                categoria:{
                    id:categoria.id,
                    nombre: categoria.nombre
                },
                subcategorias: SubcategoriasConConteo
            }
        });

    } catch (error){
        console.error('Error en getCategoria', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la categoria',
            error: error.message,
        })
    }
};

/**
 * obtener productos destacados
 * GET/ api/admin/producto/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosDestacados = async (req, res) => {
    try {
        const {limite = 8 } = req.params;
        const {Op} = require ('sequelize');

        //Verificar que la categoria exista
        const producto = await Producto.findAll({
            where:{
                activo: true,
                stock: {[Op.gt]: 0}
            },
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre'],
                    where:{activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre'],
                    where:{activo: true}
                },
            ],
            order:[['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                productos
            }
        });

    } catch (error){
        console.error('Error en getProductosDestacados', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener los productos destacados',
            error: error.message,
        });
    }
};


//Exportar todos los controladores
module.exports = {
    getProductos,
    getProductoById,
    getCategorias,
    getSubcategoriasPorCategoria,
    getProductosDestacados
}