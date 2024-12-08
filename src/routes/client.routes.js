import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    getClientPortfolio,
    getReports,
    getReportById,
    updateClientProfile,
    sendMessage,
} from "../controllers/client.controllers.js";

const router = Router();

//////////////////POST///////////////////////////////////////////////////////
//ruta para enviar mensajes o mails solicitando informacion
router.post("/sendMessage", authTokenJwt, authRole(["client"]), sendMessage);
//////////////////GET///////////////////////////////////////////////////////
//verifica el token y el rol 'cliente' para servir la informacion
router.get(
    "/portfolio",
    authTokenJwt,
    authRole(["client"]),
    getClientPortfolio
);
//obtener todos los informes mensuales del cliente
router.get(
    "/:idPortfolio/reports",
    authTokenJwt,
    authRole(["client"]),
    getReports
);
//obtener un informe en especifico
router.get("/reports/:id", authTokenJwt, authRole(["client"]), getReportById);
//////////////////PUT///////////////////////////////////////////////////////
//modificar contrasenia u algun otro dato irrelevante
router.put("/profile", authTokenJwt, authRole(["client"]), updateClientProfile);

export default router;
