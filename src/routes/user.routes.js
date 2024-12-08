import { Router } from "express";

import { login, logout, signUpUser } from "../controllers/admin.controllers.js";
import { getUsers } from "../controllers/user.controllers.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import validateUser from "../helpers/validations/user.validations.js";

const router = Router();

//////////////////LOGIN///////////////////////////////////////////////////////
//como usuario me puedo loguear y desloguear del sistema

router.post("/login", login);
router.post("/logout", authTokenJwt, logout);

//RUTAS EXCLUSIVA DE SUPERUSER
//crear usuarios administradores
router.post("/create-admin", validateUser, signUpUser);
//obtener el listado de todos los usuarios
router.get("/user-list", getUsers);

////modificar mis datos como usuario ya sea admin o client

export default router;
