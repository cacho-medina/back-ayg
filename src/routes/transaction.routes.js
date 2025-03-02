import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    cancelTransaction,
    deleteTransaction,
    deposito,
    extraccion,
    getTransactionById,
    getTransactionByUserId,
    getTransactions,
    getTransactionStats,
    requestTransaction,
} from "../controllers/client.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getTransactions);
router.get("/:idUser", authTokenJwt, getTransactionByUserId);
router.get("/id/:id", authTokenJwt, authRole(["admin"]), getTransactionById);
router.patch("/retiro", authTokenJwt, authRole(["admin"]), extraccion);
router.patch("/deposito", authTokenJwt, authRole(["admin"]), deposito);
router.post("/new", authTokenJwt, requestTransaction);
router.patch(
    "/cancel/:id",
    authTokenJwt,
    authRole(["admin"]),
    cancelTransaction
);
router.delete(
    "/delete/:id",
    authTokenJwt,
    authRole(["admin"]),
    deleteTransaction
);

router.get("/stats/:idUser", authTokenJwt, getTransactionStats);

export default router;
