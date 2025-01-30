import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    downloadFile,
    getEstadisticas,
    sendEmail,
    sendWp,
    uploadFile,
} from "../controllers/sysadmin.controllers.js";

const router = Router();

router.get("/estadisticas", authTokenJwt, authRole(["admin"]), getEstadisticas);
router.post("/upload-file", authTokenJwt, authRole(["admin"]), uploadFile);
router.post("/download-file", authTokenJwt, downloadFile);
//envio de correos personalizados
router.post("/send-email", authTokenJwt, authRole(["admin"]), sendEmail);
//futura implementacion
router.post("/send-wp", authTokenJwt, authRole(["admin"]), sendWp);

export default router;
