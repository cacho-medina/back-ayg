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

const router = Router();

//////////////////POST///////////////////////////////////////////////////////
//autentica el token de seguridad y luego verifica si el rol es 'admin'
router.post("/register", authTokenJwt, authRole(["admin"]), signUpUser);
router.post("/login", login);
router.post("/create-admin", signUpUser);
//////////////////GET///////////////////////////////////////////////////////
router.get("/", getUsers);
router.get("/:id", getUserById);
//////////////////PUT///////////////////////////////////////////////////////
router.put("/update", authTokenJwt, authRole(["admin"]), updateUserInfo);
router.put(
    "/update/status",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);
//////////////////DELETE///////////////////////////////////////////////////////
router.delete("/delete", authTokenJwt, authRole(["admin"]), deleteUser);

export default router;
