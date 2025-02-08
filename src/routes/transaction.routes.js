import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    confirmDeposito,
    confirmExtraccion,
    deleteTransaction,
    deposito,
    extraccion,
    getTransactionById,
    getTransactionByUserId,
    getTransactions,
} from "../controllers/client.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getTransactions);
router.get("/:idUser", authTokenJwt, getTransactionByUserId);
router.get("/id/:id", authTokenJwt, authRole(["admin"]), getTransactionById);
router.post("/retiro", authTokenJwt, extraccion);
router.post("/deposito", authTokenJwt, deposito);
router.post(
    "/confirmar-deposito/:id",
    authTokenJwt,
    authRole(["admin"]),
    confirmDeposito
);
router.post(
    "/confirmar-extraccion/:id",
    authTokenJwt,
    authRole(["admin"]),
    confirmExtraccion
);

router.delete(
    "/delete/:id",
    authTokenJwt,
    authRole(["admin"]),
    deleteTransaction
);

export default router;
