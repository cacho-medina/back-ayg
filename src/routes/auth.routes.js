import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    login,
    signUpUser,
    signUpAdmin,
    logout,
    resetPassword,
    forgotPassword,
} from "../controllers/auth.controllers.js";
import validateUser from "../helpers/validations/user.validations.js";
import validatePasswordReset from "../helpers/validations/password.validations.js";
import validatePlanInfo from "../helpers/validations/plan.validations.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register-admin", validateUser, signUpAdmin); //registrar un admin
router.post(
    "/signup",
    validateUser,
    validatePlanInfo,
    authTokenJwt,
    authRole(["admin"]),
    signUpUser
); //registrar un cliente

router.post("/forgot-password", forgotPassword); //enviar un correo para resetear la contraseña
router.put(
    "/reset-password",
    authTokenJwt,
    validatePasswordReset,
    resetPassword
); //cambiar la contraseña
//implementar luego
//router.post("/refresh-token", refreshToken);

export default router;
