import { Router } from "express";
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserStatus,
    activateUser,
} from "../controllers/user.controllers.js";
import { getClients } from "../controllers/admin.controllers.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";

const router = Router();

router.get("/all", authTokenJwt, getUsers);
router.get("/clients", authTokenJwt, authRole(["admin"]), getClients);
router.get("/:id", authTokenJwt, getUserById);
router.put("/update/:id", authTokenJwt, updateUser);
router.put("/delete/:id", authTokenJwt, authRole(["admin"]), deleteUser);
router.put("/activate/:id", authTokenJwt, authRole(["admin"]), activateUser);
router.put(
    "/update/status/:id",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);

export default router;
