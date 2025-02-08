import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { Op } from "sequelize";

// Obtener notificaciones del usuario
export const getUserNotifications = async (req, res) => {
    try {
        // Obtiene todas las notificaciones no leídas del usuario actual
        // req.user.id viene del middleware authTokenJwt
        const notifications = await Notification.findAll({
            where: {
                idUser: req.user.id,
                read: false,
            },
            order: [
                ["priority", "DESC"], // Ordena primero por prioridad (high -> low)
                ["createdAt", "DESC"], // Luego por fecha de creación (más recientes primero)
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "email"], // Solo incluye estos campos del usuario
                },
            ],
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener notificaciones" });
    }
};

// Marcar notificaciones como leídas
export const markAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body; // Array de IDs de notificaciones

        // Actualiza múltiples notificaciones a la vez
        await Notification.update(
            { read: true },
            {
                where: {
                    id: {
                        [Op.in]: notificationIds, // Usa operador IN de SQL
                    },
                    idUser: req.user.id, // Asegura que las notificaciones pertenezcan al usuario
                },
            }
        );

        res.status(200).json({
            message: "Notificaciones marcadas como leídas",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar notificaciones" });
    }
};

export const markOneAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                idUser: req.user.id,
            },
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notificación no encontrada",
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            message: "Notificación marcada como leída",
            notification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar la notificación",
        });
    }
};

// Obtener todas las notificaciones (para administradores)
export const getAllNotifications = async (req, res) => {
    try {
        // Verifica que el usuario sea admin (usando el middleware authRole)
        const notifications = await Notification.findAll({
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "email"],
                },
            ],
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener notificaciones" });
    }
};

// Eliminar notificaciones
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                idUser: req.user.id, // Solo permite eliminar notificaciones propias
            },
        });

        if (!notification) {
            return res
                .status(404)
                .json({ message: "Notificación no encontrada" });
        }

        await notification.destroy();

        res.status(200).json({
            message: "Notificación eliminada exitosamente",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar la notificación" });
    }
};
