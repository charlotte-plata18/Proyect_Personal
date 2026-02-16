/**
 * MODE CATEGORIA
 * define la tabla Categoria en la base de datos
 * almacena las categorias principales de los productos
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { table } = require('console');

 /**
  * Definir el modelo de la Categoria
  */
const Categoria = sequelize.define('Categoria', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        uautoIncrement: true, 
        allowNull: false 
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio  '
            },
            len: {
                args: [2, 100],
                msg: 'El nombre de la categoria debe tener entre 2y 100 caracteres'
            }
                
        }
    },

    /**
     * Descripcion de la categoria 
     */
    desripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * activo estado de la categoria
     * si es false la cayegoria y todas sus sudcategorias y productoss se ocultan
     */
    activo:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //Opciones del modelo
    
    tableName: 'categorias',
    timestamps: true, // Agrega campos createdAt y updatedAt

    /**
     * Hooks Acciones de automaticas
     */

    hooks:{
        /**
         * afterUpdate: SE ejecuta despues de la actualizar una categoria
         * si se desactiva una categoria se desactiva todas sus subcategorias y productos
         */
        afterupdate: async (categoria, options) => {
            //Verificar si el campo activo cambio
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivado categoria: ${categoria.nombre}`);

                // Importar modelos (aqui para evitar dependecias circulares)

                const Subcategoria = require('./Subcategoria');
                const Producto = require("./Producto");

                try {
                    //Paso 1 desactivar las subcategoria de esta categoria
                    const Subcategorias= await 
                    Subcategoria.findAll({
                        where:{categoriaId: categoria.id}
                    });

                    for (const Subcategoria of Subcategorias){
                        await Subcategoria.update({activo:false
                        }, {transaction:options.transaction}),
                        console.log(`Subcategorias desactivadas: ${Subcategoria.nombre}`);
                    };
                      //Paso 2 desactivar las subcategoria de esta categoria
                    const productos= await Producto.findAll({
                        where:{categoriaId: categoria.Id}
                    });

                    for (const producto of productos){
                        await producto.update({activo:false
                        }, {transaction:options.transaction}),
                        console.log(`Producto desactivadas: ${producto,nombre}`);
                    }

                    console.log(`Categoria y elementos reacionados desactivado correctamente`);
                } catch (error){
                    console.error(' Error al desacctivar elementos relacionados:', error.message)

                }

            }
            // si se activa una categoria no se activa automaticament las subcategorias y productos
        }
    }
});

//METODOS DE INSTANCI
/**Metodos para contar subcategorias de esta categoria
 * 
 * @returns {Promise<number>} - numero de subcategorias
 */
Categoria.prototype.contarsubcategorias = async function() {
    const Subcategorias = require('./Subcategoria');
    return await subcategoria.count ({
        where: {categoriaId: this.id}});

};

/**Metodos para contar productos de esta categoria
 * 
 * @returns {Promise<number>} - numero productos
 */
Categoria.prototype.contarProductos = async function() {
    const Producto = require('./Subcategoria');
    return await Producto.count ({
        where: {categoriaId: this.id}});

};

// exportar modelo Categoria 
module.exports = Categoria;
