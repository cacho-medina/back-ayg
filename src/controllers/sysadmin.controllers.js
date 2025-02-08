import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Transaction from "../models/Transaction.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendCustomEmail } from "../helpers/mails/sendEmail.js";
import {
    getCurrentUTCYear,
    getCurrentUTCMonth,
    getUTCStartOfYear,
    getUTCEndOfMonth,
} from "../utils/dateUtils.js";
import File from "../models/File.js";

export const getEstadisticas = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // 1. Clientes activos
        const activeClients = await User.count({
            where: {
                role: "client",
                isActive: true,
                isDeleted: false,
            },
            transaction: t,
        });

        // 2. Reportes y transacciones
        const [totalReports, totalTransactions] = await Promise.all([
            Report.count({ transaction: t }),
            Transaction.count({ transaction: t }),
        ]);

        // 3. Capital total en el sistema
        const totalCapital = await User.sum("capitalActual", {
            where: {
                isActive: true,
                isDeleted: false,
            },
            transaction: t,
        });

        // 4. Historial de ganancias mensual del año actual
        const now = new Date().toISOString();
        const currentYear = getCurrentUTCYear();
        const firstDayYear = getUTCStartOfYear(currentYear);
        const lastDayCurrentMonth = getUTCEndOfMonth(
            currentYear,
            getCurrentUTCMonth()
        );

        const monthlyStats = await Report.findAll({
            where: {
                fechaEmision: {
                    [Op.and]: [
                        { [Op.gte]: firstDayYear },
                        { [Op.lte]: lastDayCurrentMonth },
                    ],
                },
            },
            attributes: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("fechaEmision")
                    ),
                    "mes",
                ],
                [
                    sequelize.fn("AVG", sequelize.col("renta")),
                    "rentabilidadPromedio",
                ],
                [
                    sequelize.fn("SUM", sequelize.col("gananciaGenerada")),
                    "gananciaTotal",
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

        // 5. Calcular rendimiento promedio general
        const rendimientoTotal = monthlyStats.reduce(
            (sum, stat) =>
                sum + parseFloat(stat.dataValues.rentabilidadPromedio || 0),
            0
        );
        const rendimientoPromedio =
            monthlyStats.length > 0
                ? rendimientoTotal / monthlyStats.length
                : 0;

        await t.commit();

        res.status(200).json({
            clientesActivos: activeClients,
            operaciones: {
                reportes: totalReports,
                transacciones: totalTransactions,
            },
            capitalTotal: totalCapital,
            rendimientoPromedio: rendimientoPromedio.toFixed(2),
            historialMensual: monthlyStats.map((stat) => ({
                mes: stat.dataValues.mes,
                rentabilidad: parseFloat(
                    stat.dataValues.rentabilidadPromedio
                ).toFixed(2),
                ganancia: parseFloat(stat.dataValues.gananciaTotal).toFixed(2),
            })),
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en getEstadisticas:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas del sistema",
            error: error.message,
        });
    }
};

export const getEstadisticasByUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idUser } = req.params;

        // Verificar que el usuario existe
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Fechas en UTC
        const now = new Date().toISOString();
        const currentYear = getCurrentUTCYear();

        const lastDayPreviousYear = new Date(
            Date.UTC(currentYear - 1, 11, 31, 23, 59, 59, 999)
        );
        const lastDayCurrentMonth = new Date(
            Date.UTC(
                currentYear,
                new Date(now).getUTCMonth() + 1,
                0,
                23,
                59,
                59,
                999
            )
        );

        // Obtener todos los reportes del usuario en el año actual
        const monthlyReports = await Report.findAll({
            where: {
                idUser,
                fechaEmision: {
                    [Op.and]: [
                        { [Op.gt]: lastDayPreviousYear },
                        { [Op.lte]: lastDayCurrentMonth },
                    ],
                },
            },
            attributes: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("fechaEmision")
                    ),
                    "mes",
                ],
                [
                    sequelize.fn("AVG", sequelize.col("renta")),
                    "rentabilidadPromedio",
                ],
                [
                    sequelize.fn("SUM", sequelize.col("gananciaGenerada")),
                    "gananciaTotal",
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

        // Calcular estadísticas de rendimiento
        const rendimientoTotal = monthlyReports.reduce(
            (sum, report) =>
                sum + parseFloat(report.dataValues.rentabilidadPromedio || 0),
            0
        );
        const rendimientoPromedio =
            monthlyReports.length > 0
                ? rendimientoTotal / monthlyReports.length
                : 0;

        // Calcular balance (positivo o negativo)
        const balance = user.capitalActual - user.capitalInicial;
        const isPositive = balance >= 0;

        await t.commit();

        res.status(200).json({
            plan: user.plan,
            balance: {
                valor: Math.abs(balance).toFixed(2),
                isPositive,
            },
            rendimientoPromedio: rendimientoPromedio.toFixed(2),
            historialMensual: monthlyReports.map((report) => ({
                mes: report.dataValues.mes,
                rentabilidad: parseFloat(
                    report.dataValues.rentabilidadPromedio
                ).toFixed(2),
                ganancia: parseFloat(report.dataValues.gananciaTotal).toFixed(
                    2
                ),
            })),
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en getEstadisticasByUser:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas del usuario",
            error: error.message,
        });
    }
};

export const sendEmail = async (req, res) => {
    try {
        const { email, subject, message, name } = req.body;

        if (!email || !subject || !message) {
            return res.status(400).json({
                message: "Faltan campos requeridos (email, subject, message)",
            });
        }

        const finded = await User.findOne({ where: { email } });
        if (!finded) {
            return res.status(404).json({
                message: "No existe un usuario con este email",
            });
        }

        try {
            await sendCustomEmail(email, name, subject, message);

            res.status(200).json({
                message: "Email enviado exitosamente",
                to: email,
            });
        } catch (error) {
            console.error("Error al enviar email:", error);
            return res.status(500).json({
                message: "Error al enviar el correo",
            });
        }
    } catch (error) {
        console.error("Error en sendEmail:", error);
        res.status(500).json({
            message: "Error al enviar el email",
            error: error.message,
        });
    }
};

export const sendWp = async (req, res) => {
    res.status(200).json({ message: "Whatsapp enviado" });
};

export const uploadFile = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { titulo, descripcion } = req.body;
        if (!req.file) {
            return res.status(400).json({
                message: "No se ha subido ningún archivo",
            });
        }

        // Obtener el idUser del query params (opcional)
        const { idUser } = req.query;

        // Si se proporciona idUser, verificar que el usuario existe
        if (idUser) {
            const user = await User.findByPk(idUser, { transaction: t });
            if (!user) {
                await t.rollback();
                return res.status(404).json({
                    message: "Usuario no encontrado",
                });
            }
        }

        // Crear registro en la tabla Files
        const file = await File.create(
            {
                idUser: idUser || null,
                name: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                type: req.file.mimetype,
                titulo: titulo || null,
                descripcion: descripcion || null,
            },
            { transaction: t }
        );

        await t.commit();

        res.status(200).json({
            message: "Archivo subido exitosamente",
            file,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en uploadFile:", error);
        res.status(500).json({
            message: "Error al subir el archivo",
            error: error.message,
        });
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = path.join(__dirname, "../../public/uploads");
        const filePath = path.join(uploadDir, filename);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Archivo no encontrado",
            });
        }

        // Verificar que el archivo está dentro del directorio uploads
        const realPath = fs.realpathSync(filePath);
        if (!realPath.startsWith(fs.realpathSync(uploadDir))) {
            return res.status(403).json({
                message: "Acceso denegado",
            });
        }

        // Obtener el tipo MIME del archivo
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
        };

        // Configurar headers
        res.setHeader(
            "Content-Type",
            mimeTypes[ext] || "application/octet-stream"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        // Enviar archivo
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error("Error en downloadFile:", error);
        res.status(500).json({
            message: "Error al descargar el archivo",
            error: error.message,
        });
    }
};

export const getFiles = async (req, res) => {
    try {
        const files = await File.findAll({
            where: {
                idUser: null,
            },
        });
        res.status(200).json(files);
    } catch (error) {
        console.error("Error en getFiles:", error);
        res.status(500).json({ message: error });
    }
};
