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
    requestTransaction,
    registerTransaction,
} from "../controllers/client.controllers.js";

const router = Router();

router.get("/all", authTokenJwt, authRole(["admin"]), getTransactions);
router.get("/:idPlan", authTokenJwt, getTransactionByUserId);
router.get("/id/:id", authTokenJwt, authRole(["admin"]), getTransactionById);
router.patch("/retiro", authTokenJwt, authRole(["admin"]), extraccion);
router.patch("/deposito", authTokenJwt, authRole(["admin"]), deposito);
router.post(
    "/register",
    authTokenJwt,
    authRole(["admin"]),
    registerTransaction
);
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

export default router;
