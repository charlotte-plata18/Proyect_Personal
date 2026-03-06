/**
 * Controlador de autenticacion
 * maneja el registro, login  yobtencion del perfil de usuario
 */

/**
 * importar modelos
 */

const Usuario = require ('../models/Usuario');
const {generarToken} = require ('../config/jwt');


/**
 * obtener todas los usuarios
 * GET/api/usuariros
 * query params:
 * Activo true/false (filtar por estado)
 * 
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const registrar  = async (req, res) => {
    try {
        const {nombre,apellido,email, password, telefono, direccion }= req.query;


        //Validacion1 verificar que todos los campos requerido esten presentes
        if(!nombre  || !apellido || !email || !password){
            return res.status(400).json({
                seccess: false,
                message: 'faltan campos requeridos: nombre, apellido, email y password son obligatorios'
            });
        }
        // validacion 2 verificar formato email 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({
                seccess:false,
                message: 'formato no valido'
            });
        }

        // validacion 3 verificar la longitud de la contraseña
        if(password.length < 6){
            return res.status(400).json({
                seccess:false,
                message: 'la contraseña debe tener al menos 6 caracteres'
            })
        }

    // validacion 4 verificar que el email no este registrado
    const usuarioExistente = await Usuario.findOne({ where:{email}});
    if(usuarioExistente){
        return res.status(400).json({
            seccess:false,
            messasge: 'email ya esta registrado'
        })
    }


/**
 * Crear nuevo usuario
 * el hook beforecreate en el modelo se encarga de hashear la contraseña antes de guardala
 * en el rol por defecto es cliente
 * @param {Object} req request express
 * @param {Object} res response express
 */
        
        // crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null,
            direccion: direccion || null, // si no se proporciona se establece como null
            rol: ' cliente '
        });

        // generarl el token JWT con datos del usuario
        const token = generarToken({
            id:nuevoUsuario.Id,
            email:nuevoUsuario.email,
            rol:nuevoUsuario.rol
        })

        // respuesta exitosa
        const usuarioRespuesta = nuevoUsuario.toJSON();
        delete usuarioRespuesta.password // elimina el campo de contraseña
        res.status(201).json({
            seccesss:true,
            message: ' Usuario registrado exitosamente',
            data:{
                usuario:usuarioRespuesta,
                token
            }
        });

    } catch (error){
        console.error('Error en crearUsuario', error);
        return res.status(500).json({
            seccesss: false,
            message:'Error de validacion',
            errors: error.message
        
        });
    }
};

/**
 * iniciar sesion login
 * autenticar un ususario con email y contraseña 
 * retornar el usuario y un token JWT si las credenciales son correctas
 * POST/api/auth/login
 * bodu:{amail. password}
 */

const login = async (req, res) => {
    try{
        // Extraes creenciales del body 
        const {email, password} =req.body;

        //validacion 1; varificar la contraseña que se proporciona email y password
        if(!email || !password){
            return res.status(400).json({
                seccesss: false,
                message: ' email y contraseña son requeridos'
            })
        }

        //validacion2 buscar usuario por email
        // necesitamos incluir el password aqui normalmente se excluye por segurirdad 
        const usuario = await Usuario.scope('withPassword').findOne({
            where:{email}
        });

        if(!usuario) {
            return res.status(401).json({
                seccess: false,
                message: 'creenciales invalidas'
            });
        }
        // Validacion3 verificar que el usuario esta activo 
        if(!usuario,activo){
            return res.status(401).json({
                success:false,
                message:'Usuario inactivo, contacte al administrador'
            });
        }

        //validacion 4 varificar la contraseña
        // usando el metodo comparapassword del modelo usuario
        const passwordValida = await usuario.compararPassword(password);

        if(!passwordValida){
            return  res.status(401).json({
                success: false,
                message: 'credenciales invalidas'
            });
        }

        // Generar token JWT con datos basicos del usuario
        const token = generarToken({
            id:usuario.id,
            email: usuario.email,
            rol:usuario.rol
       });

       //preparar respuesta si password 
       const usuarioSinPassword = usuario.toJSON();
       delete usuarioSinPassword.password;
       
       //respuesta exitosa
       res.json({
        success:true,
        message: 'inicio de sesion exitoso',
        data:{
            usuario: usuarioSinPassword,
            token
        }
       })

    }catch(error){
        console.error('error en login', error)
        res.status(500).json({
            seccesss:false,
            message:'Error al iniciar usuario',
            error: error.message

        });
    }
};

/**
 * Obtener el perfil del usuario autenticado
 * require middleware verificarAuth
 * Get/api/auth/me
 * headers: (authorization: 'bearer Token')
 */

const getMe = async (req, res) => {
    try {
        //El usuarioya esta en req.usuario
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: {exclude: ['password']}
        });

        if(!usuario){
            return res.status(404).json({
                success:false,
                message:'usuario no encontrado'
            })

        }

        //respuesta exitosa 
        res.json({
            success: true,
            data:{
                usuario
            }
        });
    }catch(error){
        console.error('Eror en getMe', error)
        res.status(500).json({
            success:false,
            message:'Error al obtener perfil',
            error: error.message
        });
    }
};


/**
 * Actualiza  perdil del Usuario
 * permite al usuario actualizar su informacion personal
 * PUT/ api/auth/me
 * @param {Object} req request express
 * @param {Object} res response express
 */

const updateMe = async (req, res) =>{
    try{
        const {nombre, apellido, telefono, direccion} =req.body;

        //buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);
        
        if(!usuario) {
            return res.status(404).json({
                seccesss : false,
                message: 'Usuario no encontrada',
            })
        }
        
        // Actualizar campos
        if (nombre!==undefined) usuario.nombre = nombre;
        if (apellido!==undefined) usuario.apellido = apellido;
        if (telefono!==undefined) usuario.telefono= telefono;
        if (direccion!==undefined) usuario.direccion = direccion;

    

        // guardar cambios
        await usuario.save();

        // respuesta exitosa
        res.json({
            seccesss: true,
            message: 'perfilactualizada exitosamente',
            data:{
                usuarios: usuario.toJSON()
            }
        });
    
         }catch (error){
            console.error('Error en updateMe:', error);
            return res.status(500).json({
                seccesss:false,
                message: 'Error al actulizar perfil',
                errors: error.message
            });
        }
    };

    /**
     * cambiar la contraseñadel usuario authenticado
     * permite al usuario cambiar su contraseña 
     * requiere su contraseña actual por seguridad
     * PUT/api/Auth/cahnge-password
     */

    const chagePassword = async (req, res) => {
        try{
            const{passwordActual,passwordNuevo} = req.body;

            //validacion 1verificar que se proporcione ambas contraseñas
            if(!passwordActual||!passwordNuevo){
                return res.status(400).json({
                    success: false,
                    message: 're queriere contraseña actual y nueva contraseña'
                });
            }

            //validacion 2 
            if(!passwordActual.legth < 6){
                return res.status(400).json({
                    success: false,
                    message: 're queriere contraseña actual debe tener al menos 6 caracteres'
                });
            };

            // validacion 3 buscar que el usuario con password incluido 
            const usuario = await Usuario.scope(`withpassword`).findByPk(req.usuario.id);
            if(!usuario){
                return res.status(400).json({
                    success: false,
                    message: 'usuario no encontrado'
                });
            }
            // validacion 4  verificar que la contraseña actual se la correcta
            const passwordValida = await usuario.compararPassword(passwordActual);
            if(!passwordActual){
                return res.status(400).json({
                    success: false,
                    message: 'contraseña  actual incorrecta'
                });
            }

            // actualizar contraseña 
            usuario.password = passwordNuevo;
            await usuario.save();

            // respuesta exitosa
            res.json({
                success:true,
                message: 'contraseña actualizadaexitosamente'
            })
        }catch (error) {
        console.error('Error en chagePassword', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
}


//Exportar todos los controladores
module.exports = {
    registrar,
    login,
    getMe,
    updateMe,
    chagePassword
};