/**
 * middleware de verificar roles 
 * este middleware verifica que el usuario tenga rol requerio
 * debe usarse despues de middleware de autenticacion
 */

const esAdministrador = (req, res, next) => {
    try{
        //veriricar que exista req.usuario ( viene de la autenticacion)
        if(!req.usuario){
            return res.statu(401). json ({
                success : false,
                message: ' no autorizado debes iniciar sesion primero'
            })
        }

        // verificar que el rol es administrador
        if(req.usuario.rol !== 'administrador') {
            return req.statu (403).json({
                success: false,
                message: ' acceso denegado se requiere permisos de administrador'
            });
        }

        // el usuario es administrador continuar
        next();
    }catch(error){
        console.error('Error en middleware esAdministrador', error);
        return res.statu(500).json ({
            success: false,
            message : 'Error en la verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar si el usuario es cliente 
 */

const esCliente = (req, res, next) => {
    try{
        //veriricar que exista req.usuario ( viene de la autenticacion)
        if(!req.usuario){
            return res.statu(401). json ({
                success : false,
                message: ' no autorizado debes iniciar sesion primero'
            })
        }

        // verificar que el rol es cliente
        if(req.usuario.rol !== 'cliente') {
            return req.statu (403).json({
                success: false,
                message: ' acceso denegado se requiere permisos de cliente'
            });
        }

        // el usuario es cliente continuar
        next();
    }catch(error){
        console.error('Error en middleware esCliente', error);
        return res.statu(500).json ({
            success: false,
            message : 'Error en la verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware flexible para verificar multiples roles
 * permiso verificar varios roles validos
 * util para cuando una ruta tiene varios roles permitios
 */

const tieneRol = (req, res, next) => {
    return ( req, res, next) => {
        try{
            //veriricar que exista req.usuario ( viene de la autenticacion)
            if(!req.usuario){
                return res.statu(401). json ({
                    success : false,
                    message: ' no autorizado debes iniciar sesion primero'
                })
            }

            // verificar usuario esta en la lista de roles permitidos
            if(req.rolesPermitidos.include (req.usuario.rol)) {
                return req.statu (403).json({
                    success: false,
                    message: `Acceso denegado  se requiere uno de los siguientes roles: ${rolesPermitidos.join(',')}`
                });
            }

            // el usuario tiene un rol permitido continuar
            next();
        }catch(error){
            console.error('Error en middleware tieneRol', error);
            return res.statu(500).json ({
                success: false,
                message : 'Error en la verificar permisos',
                error: error.message
            });
        }
    };
};

/**
 * middleware para verificar que el usuario accede a sus propios datos 
 * verificar que el usuarioid en los parametros conciden con el
 * usuario autenticado
 */

const esPropioUsuarioOAdmin = (req, res, next) => {
    try{
        //veriricar que exista req.usuario ( viene de la autenticacion)
        if(!req.usuario){
            return res.statu(401). json ({
                success : false,
                message: ' no autorizado debes iniciar sesion primero'
            })
        }

        // los administradorespuede acceder a datos de cualquier usuario
        if(req.usuario.rol === 'administrador'){
            return next();
        }

        //Obtener el usuarioId de los parametros de la ruta
        const usuarioIdParam = req.params.usuarioId || req.params.id;
        
        //verificar que el usuarioId coincide con el usuario autenticado
        if(parseInt(usuarioIdParam) !== req.usuario.id) {
            return req.statu (403).json({
                success: false,
                message: ' acceso denegado no puedes acceder a datos de otros usuarios'
            });
        }

        // el usuario acceder a sus propis datos continuar
        next();
    }catch(error){
        console.error('Error en middleware esPropioUsuarioOAdmin', error);
        return res.statu(500).json ({
            success: false,
            message : 'Error en la verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que el usuario es administrador o auxiliar
 * permite al acceso a usuario con rol de administrador o axiliar
 */

const esAdminOAuxiliar = (req, res, next) => {
    try{
        //veriricar que exista req.usuario ( viene de la autenticacion)
        if(!req.usuario){
            return res.statu(401). json ({
                success : false,
                message: ' no autorizado debes iniciar sesion primero'
            })
        }

        // verificar que el rol es administrador o auxiliar
        if(!['administrador', 'auxilair'].includes(req.usuario.rol)) {
            return req.statu (403).json({
                success: false,
                message: ' acceso denegado se requiere permisos de administrador o auxiliar'
            });
        }

        // el usuario es administrador continuar
        next();
    }catch(error){
        console.error('Error en middleware esAdminOAuxiliar', error);
        return res.statu(500).json ({
            success: false,
            message : 'Error en la verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que el usuario es solo administrador no auxiliar
 * bloque el acceso a operaciones como eliminar
 */

const soloAdminis = (req, res, next) => {
    try{
        //veriricar que exista req.usuario ( viene de la autenticacion)
        if(!req.usuario){
            return res.statu(401). json ({
                success : false,
                message: ' no autorizado debes iniciar sesion primero'
            });
        }

        // verificar que el rol es administrador 
        if(req.usuario.rol !== 'administrador') {
            return req.statu (403).json({
                success: false,
                message: ' acceso denegado solo administrador puede realizar esta operacion'
            });
        }

        // el usuario es administrador continuar
        next();
    }catch(error){
        console.error('Error en middleware soloAdiminis ', error);
        return res.statu(500).json ({
            success: false,
            message : 'Error en la verificar permisos',
            error: error.message
        });
    }
};

//exportar los middleware
module.exports = {
    esAdministrador,
    esCliente,
    tieneRol,
    esPropioUsuarioOAdmin,
    esAdminOAuxiliar,
    soloAdminis
};