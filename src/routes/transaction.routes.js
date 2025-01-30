import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    deleteTransaction,
    deposito,
    extraccion,
    getTransactionById,
    getTransactionByUserId,
    getTransactions,
} from "../controllers/client.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getTransactions);
router.get(
    "/:idUser",
    authTokenJwt,
    authRole(["admin"]),
    getTransactionByUserId
);
router.get("/id/:id", authTokenJwt, authRole(["admin"]), getTransactionById);
router.post("/retiro", authTokenJwt, authRole(["admin"]), extraccion);
router.post("/deposito", authTokenJwt, authRole(["admin"]), deposito);
router.delete(
    "/delete/:id",
    authTokenJwt,
    authRole(["admin"]),
    deleteTransaction
);

export default router;
