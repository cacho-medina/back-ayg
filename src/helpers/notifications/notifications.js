import Notification from "../models/Notification.js";

export const createNotification = async ({
    idUser,
    title,
    message,
    type = "other",
    priority = "low",
}) => {
    try {
        const notification = await Notification.create({
            idUser,
            title,
            message,
            type,
            priority,
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

export const createTransactionNotification = async (transaction, user) => {
    const title = `Nueva ${transaction.tipo} registrada`;
    const message = `Se ha registrado un${
        transaction.tipo === "deposito" ? "a" : ""
    } ${transaction.tipo} por $${transaction.monto}`;

    return createNotification({
        idUser: user.id,
        title,
        message,
        type: "transaction",
        priority: "medium",
    });
};

export const createReportNotification = async (report, user) => {
    const title = "Nuevo reporte disponible";
    const message = `Se ha generado tu reporte mensual con una rentabilidad del ${report.renta}%`;

    return createNotification({
        idUser: user.id,
        title,
        message,
        type: "report",
        priority: "high",
    });
};
