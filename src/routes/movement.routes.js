import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    getMovements,
    getMovementById,
    createMovement,
    deleteMovement,
    updateMovement,
    uploadMovements,
} from "../controllers/movement.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getMovements);
router.get("/:id", authTokenJwt, getMovementById);
router.post("/create", authTokenJwt, authRole(["admin"]), createMovement);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deleteMovement);
router.put("/update/:id", authTokenJwt, authRole(["admin"]), updateMovement);
router.post("/upload", authTokenJwt, authRole(["admin"]), uploadMovements);

export default router;
