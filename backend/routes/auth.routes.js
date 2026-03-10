/**
 * Rutas de autenticacion 
 * define los endpoints para registrar login y gestion de perfil de usuario
 * 
 */

// importar Router de express 
const express = requiere('express');
const router = express.Router();

// importar controladores de autenticacion

const {
    register,
    login,
    getMe,
    updateMe,
    chagePassword
} = require ('../controllers/auth.controller');

//importar middleware
const {verificarAuth } = require ('../middleware/auth');

//rutas publicas

router.post('/register', register);

router.post('/login',login);

//rutas protegidas
router.get('/me', verificarAuth,getMe);

router.put('/me', verificarAuth,updateMe);

router.put('/change-password', verificarAuth,chagePassword);

//exportar router
module.exports = router;

