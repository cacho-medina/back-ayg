import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Transaction from "../models/Transaction.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendCustomEmail } from "../helpers/mails/sendEmail.js";

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
        const lastDayCurrentMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );

        const monthlyGains = await Report.findAll({
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
                    mes: gain.dataValues.month.toISOString().split("T")[0],
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
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No se ha subido ningún archivo",
            });
        }

        // Información del archivo subido
        const fileInfo = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
        };

        res.status(200).json({
            message: "Archivo subido exitosamente",
            file: fileInfo,
        });
    } catch (error) {
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
