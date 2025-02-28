import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    downloadFile,
    getEstadisticas,
    getEstadisticasByUser,
    getFileByUserId,
    getFiles,
    getFilesByType,
    sendEmail,
    sendWp,
    uploadFile,
    deleteFile,
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
router.get("/files/:idUser", authTokenJwt, getFileByUserId);
router.get("/files/type/:type", authTokenJwt, getFilesByType);
router.delete(
    "/files/delete/:id",
    authTokenJwt,
    authRole(["admin"]),
    deleteFile
);

router.get("/download-file/:filename", authTokenJwt, downloadFile);
//envio de correos personalizados
router.post("/send-email", authTokenJwt, sendEmail);
//futura implementacion
router.post("/send-wp", authTokenJwt, authRole(["admin"]), sendWp);

export default router;
