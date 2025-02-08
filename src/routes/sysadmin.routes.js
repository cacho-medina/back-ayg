import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    downloadFile,
    getEstadisticas,
    getEstadisticasByUser,
    getFiles,
    sendEmail,
    sendWp,
    uploadFile,
} from "../controllers/sysadmin.controllers.js";
import upload from "../middleware/upload.js";

const router = Router();

router.get("/estadisticas", authTokenJwt, authRole(["admin"]), getEstadisticas);
router.get("/:idUser/estadisticas", authTokenJwt, getEstadisticasByUser);

router.post(
    "/upload-file",
    authTokenJwt,
    authRole(["admin"]),
    upload.single("file"),
    uploadFile
);

router.get("/files", authTokenJwt, getFiles);

router.get("/download-file/:filename", authTokenJwt, downloadFile);
//envio de correos personalizados
router.post("/send-email", authTokenJwt, authRole(["admin"]), sendEmail);
//futura implementacion
router.post("/send-wp", authTokenJwt, authRole(["admin"]), sendWp);

export default router;
