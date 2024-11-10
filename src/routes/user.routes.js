import {
    getUserById,
    getUsers,
    signUpUser,
    login,
    deleteUser,
    updateUserInfo,
    changeUserStatus,
} from "../controllers/user.controllers.js";
import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import validateUser from "../helpers/validations/user.validations.js";

const router = Router();

//////////////////POST///////////////////////////////////////////////////////
//autentica el token de seguridad y luego verifica si el rol es 'admin'
//valida los datos ingresados
router.post(
    "/register",
    authTokenJwt,
    authRole(["admin"]),
    validateUser,
    signUpUser
);
router.post("/login", login);
router.post("/create-admin", validateUser, signUpUser);
//////////////////GET///////////////////////////////////////////////////////
router.get("/", getUsers);
router.get("/:id", getUserById);
//////////////////PUT///////////////////////////////////////////////////////
router.put(
    "/update",
    authTokenJwt,
    authRole(["admin"]),
    validateUser,
    updateUserInfo
);
router.put(
    "/update/status",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);
//////////////////DELETE///////////////////////////////////////////////////////
router.delete("/delete", authTokenJwt, authRole(["admin"]), deleteUser);

export default router;
