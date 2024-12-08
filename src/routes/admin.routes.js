import {
    signUpUser,
    deleteUser,
    updateUserInfo,
    changeUserStatus,
    getClients,
    getClientById,
    asocciateClientPlan,
    getReports,
    getReportByClientId,
    getReportById,
    createReport,
    deleteReport,
} from "../controllers/admin.controllers.js";
import { Router } from "express";
import authRole from "../middleware/authRole.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import validateUser from "../helpers/validations/user.validations.js";

const router = Router();

///////////////////CRUD CLIENTES///////////////////////////////////////////
//////////////////POST///////////////////////////////////////////////////////
//registra un 'cliente'
router.post(
    "/register",
    authTokenJwt,
    authRole(["admin"]),
    validateUser,
    signUpUser
);
//asociar cliente con plan de inversiones
router.post(
    "/create-portfolio",
    authTokenJwt,
    authRole(["admin"]),
    asocciateClientPlan
);

//////////////////GET///////////////////////////////////////////////////////
//obtener lista de clientes o cliente por id
router.get("/clients", authTokenJwt, authRole(["admin"]), getClients);
router.get("/client/:id", authTokenJwt, authRole(["admin"]), getClientById);
//////////////////PUT///////////////////////////////////////////////////////
router.put("/update/:id", authTokenJwt, authRole(["admin"]), updateUserInfo);
//modifica el estado de activo a inactivo y viceversa
router.put(
    "/update/status/:id",
    authTokenJwt,
    authRole(["admin"]),
    changeUserStatus
);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deleteUser);

/////////////////////////////////////////////////////////////////////////
/////////////////CRUD DE REPORTES////////////////////////////////////////
router.get("/reports", authTokenJwt, authRole(["admin"]), getReports);
router.get("/reports/:id", authTokenJwt, authRole(["admin"]), getReportById);
router.get(
    "/reports/client/:id",
    authTokenJwt,
    authRole(["admin"]),
    getReportByClientId
);
router.post("/new-report", authTokenJwt, authRole(["admin"]), createReport);
router.delete("/reports/:id", authTokenJwt, authRole(["admin"]), deleteReport);

export default router;
