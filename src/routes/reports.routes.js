import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    createReport,
    deleteReport,
    getReportById,
    getReportByUserId,
    getReports,
} from "../controllers/admin.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getReports);
router.get("/:idPlan/all", authTokenJwt, getReportByUserId);
router.get("/id/:id", authTokenJwt, getReportById);
router.post("/create", authTokenJwt, authRole(["admin"]), createReport);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deleteReport);

export default router;
