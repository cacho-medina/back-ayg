import { Router } from "express";
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserStatus,
    activateUser,
    getUserByName,
    editUserPlan,
} from "../controllers/user.controllers.js";
import { getClients } from "../controllers/admin.controllers.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";

const router = Router();

router.get("/all", authTokenJwt, getUsers);
router.get("/nombre/:name", authTokenJwt, getUserByName);
router.get("/clients", authTokenJwt, authRole(["admin"]), getClients);
router.get("/:id", authTokenJwt, getUserById);
router.patch("/update/:id", authTokenJwt, updateUser);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deleteUser);
router.patch("/activate/:id", authTokenJwt, authRole(["admin"]), activateUser);
router.patch(
    "/update/status/:id",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);
router.patch(
    "/update/user-plan/:id",
    authTokenJwt,
    authRole(["admin"]),
    editUserPlan
);

export default router;
