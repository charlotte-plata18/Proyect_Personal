/**
 * middleware de autenticacion JWT
 * este archivo verifica que el usuario tenga un token valido
 * se usapara las rutas protegidas que requieren autenticacion
 */

//importar funcines de JWT
const jwt = {verifyToken, extractToken} = require('../config/jwt');

const { extractToken, verifyToken } = require('../config/jwt');
//importar modelo de usuario
const Usuario = require('../models/Usuario');



// middleware de autenticacion

const verificarAuth = async (req, res, next) => {
    try{
        //passo 1 ontener el token del header authorization
        const authHeader = req.header = req.headers.authorization

        if(!authHeader) {
            return res.status(401).json({
                succes: false,
                message: ' no se proporciono token de autenticacion'
            });
        }

        //Extraer el token quitar bearer
        const token = extractToken(authHeader);

        if (!token){
            return res.status(401).json({
                succes: false,
                message: 'token de autenticacion invalido'
            });
        }
        //paso 2 verificar que el token oes valido 
        let decoded; // funcion para decodificar token
        try{
            decoded = verificarToken (token);
        }catch (error){
            return res.status(401).json({
                succes:false,
                message: error.message //token expirado o invalido
            })
        }

        // buscar el usuario de la base de datos
        const usuario = await Usuario.findById(decoded.id,{
            attributes: {exclude: ['password']}
        });

        if (!usuario){
            return res.status(401).json({
                succes:false,
                message: 'Usuario no encontrado'
            });
        }

        // paso 4 verificar que el usuario esta activo
        if (!usuario.activo){
            return res.status(401).json({
                succes:false,
                message: 'Usuario inactivo contacte al administrador'
            });
        }
        //paso 5 agregar el usuario al objeto req para uso posterior
        // ahora en los controladores podemos acceder a req.usuario

        // continuar en el siguiente 
        next();

        
    }catch(error){
        console.error('Error en middleware de autenticacion:', error)
        res.status(500).json({
            succes: false,
            message:'Error en la verificacion en autenticacion',
            error: message.error
        });
    }
};

/**
 * middleware opcional de autenticacion 
 * simimlar a verificarAuth pero no retorna errro si no 
 * hay token
 * es para rutas que no requieren autenticacion
 */

const verificarAuthOpcional = async  (erq, res, next) =>{
    try{
        const authHeader = req.header.authorization;

        // si no hay token continua sin usuario
        if(!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);

        if(!token){
            req.usuario = null;
            return next();
        }

        try{
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id, {
                attributes: {exclude: ['password']}
            });

            if( usuario && usuario.activo){
                req.usuario = usuario;
            }else{
                req.usuario = null; 
            }
        }catch (error){
            // Token invalido o expirado continua sin usuario
            req.usuario = null;
        }

        next();
    }catch(error){
        console.error('Error en middleware de autenticacion opcional', error);
        req.usuario = null;
        next();
    }
};

// exportar middleware
module.exports = {
    verificarAuth,
    verificarAuthOpcional
}