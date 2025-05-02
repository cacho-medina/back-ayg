import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
    sendTransactionConfirmationEmail,
    sendTransactionRequestEmail,
} from "../helpers/mails/sendEmail.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import Plan from "../models/Plan.js";

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
        if (sort === "date_asc") {
            order.push(["fechaTransaccion", "ASC"]);
        } else {
            order.push(["fechaTransaccion", "DESC"]);
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
                        model: Plan,
                        as: "plan",
                        attributes: ["id", "periodo"],
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "nroCliente"],
                            },
                        ],
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
                    model: Plan,
                    as: "plan",
                    attributes: ["id", "periodo"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name", "nroCliente"],
                        },
                    ],
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
            idPlan: req.params.idPlan,
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
        if (sort === "date_asc") {
            order.push(["fechaTransaccion", "ASC"]);
        } else {
            order.push(["fechaTransaccion", "DESC"]);
        }

        const { count, rows: transactions } = await Transaction.findAndCountAll(
            {
                where,
                order,
                include: [
                    {
                        model: Plan,
                        as: "plan",
                        attributes: ["id", "periodo"],
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "nroCliente"],
                            },
                        ],
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

export const requestTransaction = async (req, res) => {
    try {
        const { idPlan, monto, tipo, fechaTransaccion, currency } = req.body;

        const t = await sequelize.transaction();

        // Buscar usuario dentro de la transacción
        const plan = await Plan.findByPk(idPlan, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "nroCliente", "email"],
                },
            ],
            transaction: t,
        });
        if (!plan) {
            await t.rollback();
            return res.status(404).json({ message: "Plan no encontrado" });
        }

        if (tipo === "retiro" && plan.capitalActual < monto) {
            // Verificar capital suficiente en caso de ser retiro
            await t.rollback();
            return res.status(400).json({
                message:
                    "No tienes suficiente capital para realizar esta extracción",
            });
        }

        // Crear la transacción
        const transaction = await Transaction.create(
            {
                idPlan,
                monto,
                tipo,
                fechaTransaccion,
                currency: currency || plan.currency,
                status: "pendiente",
            },
            { transaction: t }
        );

        await t.commit();

        // Enviar email informando la solicitud de la transacción
        /* try {
            await sendTransactionRequestEmail(
                plan.user.email,
                plan.user.name,
                tipo,
                monto,
                fechaTransaccion,
                currency || plan.currency
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        } */

        res.status(201).json({
            message: "Solicitud de transacción creada exitosamente",
            transaction,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error requesting transaction" });
    }
};

export const extraccion = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idTransaction, idPlan } = req.body;

        const plan = await Plan.findByPk(idPlan, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"],
                },
            ],
            transaction: t,
        });
        if (!plan) {
            await t.rollback();
            return res.status(404).json({ message: "Plan no encontrado" });
        }

        const transaction = await Transaction.findByPk(idTransaction, {
            transaction: t,
        });
        if (!transaction) {
            await t.rollback();
            return res
                .status(404)
                .json({ message: "Transacción no encontrada" });
        }
        if (transaction.status !== "pendiente") {
            await t.rollback();
            return res
                .status(400)
                .json({ message: "La transacción esta resuelta" });
        }

        //actualizar capital del usuario
        plan.capitalActual -= transaction.monto;
        await plan.save({ transaction: t });

        //actualizar estado de transaccion
        transaction.status = "completado";
        await transaction.save({ transaction: t });

        // Si todo está bien, confirmar la transacción
        await t.commit();

        // Enviar email después de confirmar la transacción
        /* try {
            await sendTransactionConfirmationEmail(
                plan.user.email,
                plan.user.name,
                "completado",
                "retiro",
                transaction.monto,
                transaction.fechaTransaccion
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        } */

        res.status(200).json({
            message: "Solicitud de retiro resuelta exitosamente",
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
        const { idTransaction, idPlan } = req.body;

        const plan = await Plan.findByPk(idPlan, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"],
                },
            ],
            transaction: t,
        });
        if (!plan) {
            await t.rollback();
            return res.status(404).json({ message: "Plan no encontrado" });
        }

        const transaction = await Transaction.findByPk(idTransaction, {
            transaction: t,
        });
        if (!transaction) {
            await t.rollback();
            return res
                .status(404)
                .json({ message: "Transacción no encontrada" });
        }
        if (transaction.status !== "pendiente") {
            await t.rollback();
            return res
                .status(400)
                .json({ message: "La transacción esta resuelta" });
        }

        //actualizar capital del usuario
        plan.capitalActual += transaction.monto;
        await plan.save({ transaction: t });

        //actualizar estado de transaccion
        transaction.status = "completado";
        await transaction.save({ transaction: t });

        // Si todo está bien, confirmar la transacción
        await t.commit();

        // Enviar email después de confirmar la transacción
        /* try {
            await sendTransactionConfirmationEmail(
                plan.user.email,
                plan.user.name,
                "completado",
                "deposito",
                transaction.monto,
                transaction.fechaTransaccion
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        } */

        res.status(200).json({
            message: "Solicitud de deposito resuelta exitosamente",
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en deposito:", error);
        res.status(500).json({
            message: "Error al procesar la solicitud de deposito",
            error: error.message,
        });
    }
};

export const cancelTransaction = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        const transaction = await Transaction.findByPk(id, {
            include: [
                {
                    model: Plan,
                    as: "plan",
                    attributes: ["id"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name", "email"],
                        },
                    ],
                },
            ],
            transaction: t,
        });
        if (!transaction) {
            await t.rollback();
            return res
                .status(404)
                .json({ message: "Transacción no encontrada" });
        }
        if (transaction.status !== "pendiente") {
            await t.rollback();
            return res
                .status(400)
                .json({ message: "La transacción esta resuelta" });
        }

        //actualizar estado de transaccion
        transaction.status = "cancelado";
        await transaction.save({ transaction: t });

        await t.commit();

        // Enviar email después de cancelar la transacción
        /* try {
            await sendTransactionConfirmationEmail(
                transaction.plan.user.email,
                transaction.plan.user.name,
                "cancelado",
                transaction.tipo,
                transaction.monto,
                transaction.fechaTransaccion
            );
        } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            // No revertimos la transacción si falla el email
        } */

        res.status(200).json({
            message: "Solicitud de transacción cancelada exitosamente",
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en cancelTransaction:", error);
        res.status(500).json({ message: "Error al cancelar la transacción" });
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
