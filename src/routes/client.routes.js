import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import {
    getPortfolio,
    getPortfolioById,
} from "../controllers/client.controllers.js";

const router = Router();

//como cliente debo ver los datos de mi portafolio de inversiones
//los reportes generados en cada portafolio
//enviar mails solicitando informacion de cosas, como solicitar cambios en mi portafolio
//////////////////POST///////////////////////////////////////////////////////
//ruta para enviar mensajes o mails solicitando informacion
//////////////////GET///////////////////////////////////////////////////////
//verifica el token y el rol 'cliente' para servir la informacion
router.route("/portfolio", authTokenJwt, authRole(["client"]), getPortfolio);
router.route(
    "/portfolio/:id",
    authTokenJwt,
    authRole(["client"]),
    getPortfolioById
);
//obtener todos los informes mensuales de todos los portafolios
//obtener los informes de un portafolio en especifico
//obtener los datos de un informe en especifico
//////////////////PUT///////////////////////////////////////////////////////
//modificar contrasenia u algun otro dato irrelevante

export default router;
