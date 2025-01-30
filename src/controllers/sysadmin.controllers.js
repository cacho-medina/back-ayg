import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Transaction from "../models/Transaction.js";

export const getEstadisticas = async (req, res) => {
    // Iniciar transacción
    const t = await sequelize.transaction();

    try {
        // 1. Clientes activos
        const [activeClients] = await Promise.all([
            User.count({
                where: {
                    role: "client",
                    isActive: true,
                    isDeleted: false,
                },
                transaction: t,
            }),
        ]);

        // 2. Reportes y transacciones
        const [totalReports, totalTransactions] = await Promise.all([
            Report.count({ transaction: t }),
            Transaction.count({ transaction: t }),
        ]);

        // 3. Monto total en el sistema
        const totalCapital = await User.sum("capitalActual", {
            where: {
                isActive: true,
                isDeleted: false,
            },
            transaction: t,
        });

        // 4. Estadísticas de rendimiento mensual
        const currentDate = new Date();
        const firstDayCurrentMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const firstDayLastMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1
        );

        const [currentMonthReports, lastMonthReports] = await Promise.all([
            Report.findAll({
                where: {
                    fechaEmision: {
                        [Op.gte]: firstDayCurrentMonth,
                    },
                },
                attributes: [
                    [sequelize.fn("AVG", sequelize.col("renta")), "avgRenta"],
                ],
                transaction: t,
            }),
            Report.findAll({
                where: {
                    fechaEmision: {
                        [Op.gte]: firstDayLastMonth,
                        [Op.lt]: firstDayCurrentMonth,
                    },
                },
                attributes: [
                    [sequelize.fn("AVG", sequelize.col("renta")), "avgRenta"],
                ],
                transaction: t,
            }),
        ]);

        // 5. Historial de ganancias anual
        const firstDayYear = new Date(currentDate.getFullYear(), 0, 1);
        const monthlyGains = await Report.findAll({
            where: {
                fechaEmision: {
                    [Op.gte]: firstDayYear,
                },
            },
            attributes: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("fechaEmision")
                    ),
                    "month",
                ],
                [
                    sequelize.fn("SUM", sequelize.col("gananciaGenerada")),
                    "totalGanancias",
                ],
            ],
            group: [
                sequelize.fn(
                    "date_trunc",
                    "month",
                    sequelize.col("fechaEmision")
                ),
            ],
            order: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("fechaEmision")
                    ),
                    "ASC",
                ],
            ],
            transaction: t,
        });

        // 6. Calcular variación porcentual
        const currentMonthAvg =
            currentMonthReports[0]?.dataValues.avgRenta || 0;
        const lastMonthAvg = lastMonthReports[0]?.dataValues.avgRenta || 0;
        const variacionPorcentual =
            lastMonthAvg !== 0
                ? ((currentMonthAvg - lastMonthAvg) / lastMonthAvg) * 100
                : 0;

        // Commit de la transacción
        await t.commit();

        // Enviar respuesta
        res.status(200).json({
            stats: {
                clientes: activeClients,
                operaciones: {
                    reportes: totalReports,
                    transacciones: totalTransactions,
                },
                finanzas: {
                    capitalTotal: totalCapital,
                    rendimiento: {
                        mesActual: currentMonthAvg,
                        mesAnterior: lastMonthAvg,
                        variacionPorcentual: variacionPorcentual.toFixed(2),
                    },
                },
                historialGanancias: monthlyGains.map((gain) => ({
                    mes: gain.dataValues.month,
                    ganancias: gain.dataValues.totalGanancias,
                })),
            },
        });
    } catch (error) {
        // Rollback en caso de error
        await t.rollback();

        console.error("Error en getEstadisticas:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas del sistema",
            error: error.message,
        });
    }
};

export const sendEmail = async (req, res) => {
    res.status(200).json({ message: "Email enviado" });
};

export const sendWp = async (req, res) => {
    res.status(200).json({ message: "Whatsapp enviado" });
};

export const uploadFile = async (req, res) => {
    res.status(200).json({ message: "Archivo subido" });
};

export const downloadFile = async (req, res) => {
    res.status(200).json({ message: "Archivo descargado" });
};
