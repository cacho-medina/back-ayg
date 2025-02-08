import { Router } from "express";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";
import {
    getUserNotifications,
    markAsRead,
    getAllNotifications,
    deleteNotification,
    markOneAsRead,
} from "../controllers/notifications.controllers.js";

const router = Router();

// Rutas para usuarios normales
router.get("/", authTokenJwt, getUserNotifications);
router.put("/mark-read", authTokenJwt, markAsRead);
router.delete("/:id", authTokenJwt, deleteNotification);

// Rutas para administradores
router.get("/all", authTokenJwt, authRole(["admin"]), getAllNotifications);

// Marcar una notificación como leída
router.patch("/:id/read", authTokenJwt, markOneAsRead);

// Marcar múltiples notificaciones como leídas
router.patch("/read-many", authTokenJwt, markAsRead);

export default router;
