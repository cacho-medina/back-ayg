import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendCustomEmail } from "../helpers/mails/sendEmail.js";
import { getCurrentUTCYear } from "../utils/dateUtils.js";
import File from "../models/File.js";
import MovementReport from "../models/MovementReport.js";

export const getEstadisticas = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // 1. Obtener fechas relevantes
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();

        // Calcular primer día de hace 6 meses
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // 2. Estadísticas básicas
        const [activeClients, totalReports, movementReports] =
            await Promise.all([
                User.count({
                    where: {
                        role: "client",
                        isActive: true,
                        isDeleted: false,
                    },
                    transaction: t,
                }),
                Report.count({
                    where: {
                        fechaEmision: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1),
                        },
                    },
                    transaction: t,
                }),
                MovementReport.count({
                    where: {
                        close_frame: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1),
                        },
                    },
                    transaction: t,
                }),
            ]);

        // 3. Calcular rentabilidad promedio de movimientos
        const movementStats = await MovementReport.findAll({
            where: {
                close_frame: {
                    [Op.gte]: sixMonthsAgo,
                    [Op.lt]: new Date(currentYear, currentMonth + 1, 1),
                },
            },
            attributes: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("close_frame")
                    ),
                    "mes",
                ],
                [
                    sequelize.fn("AVG", sequelize.col("rentabilidad_total")),
                    "rentabilidadPromedio",
                ],
                [
                    sequelize.fn("AVG", sequelize.col("rentabilidad_personal")),
                    "rentabilidadPersonalPromedio",
                ],
            ],
            group: [
                sequelize.fn(
                    "date_trunc",
                    "month",
                    sequelize.col("close_frame")
                ),
            ],
            order: [
                [
                    sequelize.fn(
                        "date_trunc",
                        "month",
                        sequelize.col("close_frame")
                    ),
                    "ASC",
                ],
            ],
            transaction: t,
        });

        // 4. Balance total del sistema
        const totalBalance = await User.sum("capitalActual", {
            where: {
                isActive: true,
                isDeleted: false,
            },
            transaction: t,
        });

        // 5. Historial de rentabilidad últimos 6 meses (reportes mensuales)
        const monthlyStats = await Report.findAll({
            where: {
                fechaEmision: {
                    [Op.gte]: sixMonthsAgo,
                    [Op.lt]: new Date(currentYear, currentMonth + 1, 1),
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

        await t.commit();

        res.status(200).json({
            estadisticasActuales: {
                clientesActivos: activeClients,
                reportesMes: totalReports,
                movimientosMes: movementReports,
            },
            balanceTotal: totalBalance,
            rentabilidadMensual: monthlyStats.map((stat) => ({
                mes: stat.dataValues.mes,
                rentabilidad: parseFloat(
                    stat.dataValues.rentabilidadPromedio
                ).toFixed(2),
            })),
            rentabilidadMovimientos: movementStats.map((stat) => ({
                mes: stat.dataValues.mes,
                rentabilidadTotal: parseFloat(
                    stat.dataValues.rentabilidadPromedio
                ).toFixed(2),
                rentabilidadPersonal: parseFloat(
                    stat.dataValues.rentabilidadPersonalPromedio
                ).toFixed(2),
            })),
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en getEstadisticasAdmin:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas administrativas",
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

        // Obtener fecha actual y calcular fecha de inicio (6 meses atrás)
        const now = new Date();
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        // Obtener todos los reportes del usuario en los últimos 6 meses
        const monthlyReports = await Report.findAll({
            where: {
                idUser,
                fechaEmision: {
                    [Op.gte]: sixMonthsAgo,
                    [Op.lt]: new Date(now.getFullYear(), now.getMonth() + 1, 1),
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
                [sequelize.fn("AVG", sequelize.col("renta")), "rentabilidad"],
                [sequelize.fn("MAX", sequelize.col("balance")), "balance"],
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

        // Mapear los meses a formato español abreviado
        const mesesAbreviados = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
        ];

        const data = monthlyReports.map((report) => ({
            month: mesesAbreviados[new Date(report.dataValues.mes).getMonth()],
            balance: parseFloat(report.dataValues.balance).toFixed(2),
            rentabilidad: parseFloat(report.dataValues.rentabilidad).toFixed(2),
        }));

        // Calcular estadísticas generales
        const rendimientoPromedio =
            data.reduce((acc, curr) => acc + parseFloat(curr.rentabilidad), 0) /
            data.length;

        const balanceInicial = parseFloat(
            data[0]?.balance || user.capitalInicial
        );
        const balanceActual = parseFloat(
            data[data.length - 1]?.balance || user.capitalActual
        );
        const rendimientoTotal =
            ((balanceActual - balanceInicial) / balanceInicial) * 100;

        await t.commit();

        res.status(200).json({
            plan: user.plan,
            estadisticasGenerales: {
                rendimientoPromedio: rendimientoPromedio.toFixed(2),
                rendimientoTotal: rendimientoTotal.toFixed(2),
                balanceInicial: balanceInicial.toFixed(2),
                balanceActual: balanceActual.toFixed(2),
            },
            data,
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
