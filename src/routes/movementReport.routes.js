import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    createMovementReport,
    getMovementReports,
    getMovementReportById,
    deleteMovementReport,
    updateMovementReport,
} from "../controllers/movementReport.controllers.js";

const router = Router();

router.post("/create", authTokenJwt, authRole(["admin"]), createMovementReport);
router.get("/all", authTokenJwt, getMovementReports);
router.get("/:id", authTokenJwt, getMovementReportById);
router.patch(
    "/update/:id",
    authTokenJwt,
    authRole(["admin"]),
    updateMovementReport
);
router.delete(
    "/delete/:id",
    authTokenJwt,
    authRole(["admin"]),
    deleteMovementReport
);

export default router;
