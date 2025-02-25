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
import { uploadExcel } from "../middleware/process-excel.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getMovements);
router.get("/:id", authTokenJwt, getMovementById);
router.post("/create", authTokenJwt, authRole(["admin"]), createMovement);
router.post(
    "/upload",
    authTokenJwt,
    authRole(["admin"]),
    uploadExcel.single("file"),
    uploadMovements
);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deleteMovement);
router.patch("/update/:id", authTokenJwt, authRole(["admin"]), updateMovement);

export default router;
