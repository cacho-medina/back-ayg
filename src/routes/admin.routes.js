import {
    signUpUser,
    deleteUser,
    updateUserInfo,
    changeUserStatus,
    getClients,
    getClientById,
    asocciateClientPlan,
} from "../controllers/admin.controllers.js";
import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import validateUser from "../helpers/validations/user.validations.js";

const router = Router();

//Client Management
//////////////////POST///////////////////////////////////////////////////////
//autentica el token de seguridad y luego verifica si el rol es 'admin'
//valida los datos ingresados
//registra un 'cliente'
router.post(
    "/register",
    authTokenJwt,
    authRole(["admin"]),
    validateUser,
    signUpUser
);
//asociar cliente con plan de inversiones
router.post(
    "/create-portfolio",
    authTokenJwt,
    authRole(["admin"]),
    asocciateClientPlan
);

//////////////////GET///////////////////////////////////////////////////////
//obtener lista de clientes o cliente por id
router.get("/clients", authTokenJwt, authRole(["admin"]), getClients);
router.get("/client/:id", authTokenJwt, authRole(["admin"]), getClientById);
//////////////////PUT///////////////////////////////////////////////////////
router.put(
    "/update",
    authTokenJwt,
    authRole(["admin"]),
    validateUser,
    updateUserInfo
);
//modifica el estado de activo a inactivo y viceversa
router.put(
    "/update/status",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);
//////////////////DELETE///////////////////////////////////////////////////////
router.delete("/delete", authTokenJwt, authRole(["admin"]), deleteUser);

/////////////////////////////////////////////////////////////////////////
//Falta realizar el informe mensual del estado de cuenta del cliente

export default router;
