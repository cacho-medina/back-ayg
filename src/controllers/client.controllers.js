import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { sendTransactionConfirmationEmail } from "../helpers/mails/sendEmail.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

export const getTransactions = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Parámetros de filtrado
        const { tipo, montoMin, montoMax, fechaDesde, fechaHasta, sort } =
            req.query;

        // Construir objeto de filtros
        const where = {};

        // Filtro por tipo de transacción
        if (tipo) {
            where.tipo = tipo;
        }

        // Filtro por rango de monto
        if (montoMin || montoMax) {
            where.monto = {};
            if (montoMin) {
                where.monto[Op.gte] = parseFloat(montoMin);
            }
            if (montoMax) {
                where.monto[Op.lte] = parseFloat(montoMax);
            }
        }

        // Filtro por rango de fechas
        if (fechaDesde || fechaHasta) {
            where.fechaTransaccion = {};
            if (fechaDesde && fechaHasta) {
                where.fechaTransaccion = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
                };
            } else if (fechaDesde) {
                where.fechaTransaccion = { [Op.gte]: new Date(fechaDesde) };
            } else if (fechaHasta) {
                where.fechaTransaccion = { [Op.lte]: new Date(fechaHasta) };
            }
        }

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_des") {
            order.push(["fechaTransaccion", "DESC"]);
        } else if (sort === "date_asc") {
            order.push(["fechaTransaccion", "ASC"]);
        }

        // Realizar la consulta con paginación y filtros
        const { count, rows: transactions } = await Transaction.findAndCountAll(
            {
                where,
                order,
                limit,
                offset,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["name", "plan", "capitalActual"],
                    },
                ],
            }
        );

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            transactions,
            total: count,
            totalPages,
            currentPage: page,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las transacciones",
            error: error.message,
        });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting transaction" });
    }
};

export const getTransactionByUserId = async (req, res) => {
    try {
        const { fechaDesde, fechaHasta, sort } = req.query;
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = {
            idUser: req.params.idUser,
        };

        // Filtro por rango de fechas
        if (fechaDesde || fechaHasta) {
            where.fechaTransaccion = {};
            if (fechaDesde && fechaHasta) {
                where.fechaTransaccion = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
                };
            } else if (fechaDesde) {
                where.fechaTransaccion = { [Op.gte]: new Date(fechaDesde) };
            } else if (fechaHasta) {
                where.fechaTransaccion = { [Op.lte]: new Date(fechaHasta) };
            }
        }

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_des") {
            order.push(["fechaTransaccion", "DESC"]);
        } else if (sort === "date_asc") {
            order.push(["fechaTransaccion", "ASC"]);
        }

        const { count, rows: transactions } = await Transaction.findAndCountAll(
            {
                where,
                order,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["name", "plan", "capitalActual"],
                    },
                ],
                limit,
                offset,
            }
        );

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            transactions,
            total: count,
            totalPages,
            currentPage: page,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting transaction" });
    }
};

export const extraccion = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idUser, monto, fechaTransaccion } = req.body;

        // Buscar usuario dentro de la transacción
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Verificar capital suficiente
        if (user.capitalActual < monto) {
            await t.rollback();
            return res.status(400).json({
                message:
                    "No tienes suficiente capital para realizar esta extracción",
            });
        }

        // Actualizar capital del usuario
        user.capitalActual -= monto;
        await user.save({ transaction: t });

        // Crear la transacción
        const transaction = await Transaction.create(
            {
                idUser,
                monto,
                tipo: "retiro",
                fechaTransaccion: new Date(fechaTransaccion).toISOString(),
                status: "completado",
            },
            { transaction: t }
        );

        // Si todo está bien, confirmar la transacción
        await t.commit();

        // Enviar email después de confirmar la transacción
        try {
            await sendTransactionConfirmationEmail(
                user.email,
                user.name,
                "retiro",
                monto,
                fechaTransaccion
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        }

        res.status(200).json({
            message: "Solicitud de retiro creada exitosamente",
            transaction,
            capitalActual: user.capitalActual,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en extraccion:", error);
        res.status(500).json({
            message: "Error al procesar la solicitud de retiro",
            error: error.message,
        });
    }
};

export const deposito = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idUser, monto, fechaTransaccion } = req.body;

        // Buscar usuario dentro de la transacción
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Crear la transacción
        const transaction = await Transaction.create(
            {
                idUser,
                monto,
                tipo: "deposito",
                fechaTransaccion: new Date(fechaTransaccion).toISOString(),
                status: "completado",
            },
            { transaction: t }
        );

        // Crear notificación de solicitud de depósito
        /* await createNotification(
            {
                idUser,
                title: "Solicitud de depósito enviada",
                message: `Tu solicitud de depósito por $${monto} está siendo procesada`,
                type: "transaction",
                priority: "medium",
            },
            { transaction: t }
        ); */

        // Confirmar la transacción
        await t.commit();

        // Enviar email después de confirmar la transacción
        try {
            await sendTransactionConfirmationEmail(
                user.email,
                user.name,
                "deposito",
                monto,
                fechaTransaccion
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        }

        res.status(200).json({
            message: "Solicitud de depósito creada exitosamente",
            transaction,
            capitalActual: user.capitalActual,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en deposito:", error);
        res.status(500).json({
            message: "Error al procesar la solicitud de depósito",
            error: error.message,
        });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        await transaction.destroy();
        res.status(200).json({ message: "Transaction deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting transaction" });
    }
};

export const getTransactionStats = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idUser } = req.params;

        // Verificar que el usuario existe
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Obtener fecha actual y calcular fecha de inicio (12 meses atrás)
        const now = new Date();
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

        // Obtener todas las transacciones del usuario
        const transactions = await Transaction.findAll({
            where: {
                idUser,
                status: "completado",
            },
            attributes: [
                [
                    sequelize.fn(
                        "DATE_TRUNC",
                        "month",
                        sequelize.col("fechaTransaccion")
                    ),
                    "month",
                ],
                [
                    sequelize.literal(
                        `SUM(CASE WHEN tipo = 'deposito' THEN monto ELSE 0 END)`
                    ),
                    "deposito",
                ],
                [
                    sequelize.literal(
                        `SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END)`
                    ),
                    "retiro",
                ],
            ],
            group: ["month"],
            order: [
                [
                    sequelize.fn(
                        "DATE_TRUNC",
                        "month",
                        sequelize.col("fechaTransaccion")
                    ),
                    "ASC",
                ],
            ],
            transaction: t,
        });

        await t.commit();

        res.status(200).json(transactions);
    } catch (error) {
        await t.rollback();
        console.error("Error en getTransactionStats:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas de transacciones",
            error: error.message,
        });
    }
};
