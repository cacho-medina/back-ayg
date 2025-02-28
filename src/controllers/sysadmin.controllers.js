import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendCustomEmail } from "../helpers/mails/sendEmail.js";
import File from "../models/File.js";
import MovementReport from "../models/MovementReport.js";
import Transaction from "../models/Transaction.js";

export const getEstadisticas = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // 1. Obtener fechas relevantes
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();

        // Calcular primer día del mes actual y del mes anterior
        const inicioMesActual = new Date(currentYear, currentMonth, 1);
        const inicioMesSiguiente = new Date(currentYear, currentMonth + 1, 1);

        // Calcular primer día de hace 6 meses
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // 2. Obtener balance total actual y cantidad de usuarios activos
        const [balanceTotal, usuariosActivos] = await Promise.all([
            User.sum("capitalActual", {
                where: {
                    isActive: true,
                    isDeleted: false,
                },
                transaction: t,
            }),
            User.count({
                where: {
                    isActive: true,
                    isDeleted: false,
                },
                transaction: t,
            }),
        ]);

        // 3. Obtener estadísticas del último mes
        const [reportesUltimoMes, transaccionesUltimoMes, rentaUltimoMes] =
            await Promise.all([
                Report.count({
                    where: {
                        fechaEmision: {
                            [Op.gte]: inicioMesActual,
                            [Op.lt]: inicioMesSiguiente,
                        },
                    },
                    transaction: t,
                }),
                Transaction.findOne({
                    attributes: [
                        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
                        [
                            sequelize.literal(
                                `SUM(CASE WHEN tipo = 'deposito' THEN monto ELSE 0 END)`
                            ),
                            "ingresos",
                        ],
                        [
                            sequelize.literal(
                                `SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END)`
                            ),
                            "extracciones",
                        ],
                    ],
                    where: {
                        fechaTransaccion: {
                            [Op.gte]: inicioMesActual,
                            [Op.lt]: inicioMesSiguiente,
                        },
                        status: "completado",
                    },
                    transaction: t,
                }),
                Report.findOne({
                    attributes: [
                        [
                            sequelize.fn("AVG", sequelize.col("renta")),
                            "rentaPromedio",
                        ],
                    ],
                    where: {
                        fechaEmision: {
                            [Op.gte]: inicioMesActual,
                            [Op.lt]: inicioMesSiguiente,
                        },
                    },
                    transaction: t,
                }),
            ]);

        // 4. Obtener evolución mensual del balance y rentabilidad
        const monthlyStats = await Report.findAll({
            where: {
                fechaEmision: {
                    [Op.gte]: sixMonthsAgo,
                    [Op.lt]: inicioMesSiguiente,
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
                [sequelize.fn("SUM", sequelize.col("balance")), "balance"],
                [sequelize.fn("AVG", sequelize.col("renta")), "rentabilidad"],
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

        const data = monthlyStats.map((stat) => ({
            month: mesesAbreviados[new Date(stat.dataValues.mes).getMonth()],
            balance: parseFloat(stat.dataValues.balance).toFixed(2),
            rentabilidad: parseFloat(stat.dataValues.rentabilidad).toFixed(2),
        }));

        await t.commit();

        res.status(200).json({
            balanceTotal: parseFloat(balanceTotal).toFixed(2),
            rentaUltimoMes: parseFloat(
                rentaUltimoMes?.dataValues?.rentaPromedio || 0
            ).toFixed(2),
            estadisticasMensuales: {
                usuariosActivos,
                reportesGenerados: reportesUltimoMes,
                transacciones: {
                    total: parseInt(
                        transaccionesUltimoMes?.dataValues?.total || 0
                    ),
                    ingresos: parseFloat(
                        transaccionesUltimoMes?.dataValues?.ingresos || 0
                    ).toFixed(2),
                    extracciones: parseFloat(
                        transaccionesUltimoMes?.dataValues?.extracciones || 0
                    ).toFixed(2),
                },
            },
            data,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error en getEstadisticas:", error);
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

        await t.commit();

        res.status(200).json({
            plan: user.plan,
            estadisticasGenerales: {
                rendimientoPromedio: rendimientoPromedio.toFixed(2),
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
        const { subject, message, name, idUser } = req.body;

        if (!name || !subject || !message) {
            return res.status(400).json({
                message: "Faltan campos requeridos (name, subject, message)",
            });
        }

        const finded = await User.findOne({ where: { id: idUser } });
        if (!finded) {
            return res.status(404).json({
                message: "No existe el usuario",
            });
        }

        try {
            await sendCustomEmail(finded.email, name, subject, message);

            res.status(200).json({
                message: "Email enviado exitosamente",
                to: finded.email,
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
        const { titulo, descripcion, proposito, idUser } = req.body;
        if (!req.file) {
            return res.status(400).json({
                message: "No se ha subido ningún archivo",
            });
        }

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
                type: proposito,
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const { count, rows: files } = await File.findAndCountAll({
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        res.status(200).json({
            files,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error("Error en getFiles:", error);
        res.status(500).json({ message: error });
    }
};

export const getFileByUserId = async (req, res) => {
    try {
        const { idUser } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const finded = await User.findByPk(idUser);
        if (!finded) {
            return res.status(404).json({
                message: "No existe el usuario",
            });
        }

        // Buscar archivos que pertenezcan al usuario O sean archivos generales (idUser = null)
        const { count, rows: files } = await File.findAndCountAll({
            where: {
                [Op.or]: [{ idUser }, { idUser: null }],
            },
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            files,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error("Error en getFileByUserId:", error);
        res.status(500).json({
            message: "Error al obtener los archivos del usuario",
        });
    }
};

export const getFilesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const files = await File.findAll({ where: { type } });
        res.status(200).json(files);
    } catch (error) {
        console.error("Error en getFilesByType:", error);
        res.status(500).json({
            message: "Error al obtener los archivos del tipo",
            error: error.message,
        });
    }
};

export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await File.findByPk(id);

        if (!file) {
            return res.status(404).json({ message: "Archivo no encontrado" });
        }

        // Eliminar archivo físico
        const filePath = file.path;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Eliminar registro de la base de datos
        await file.destroy();

        res.status(200).json({ message: "Archivo eliminado correctamente" });
    } catch (error) {
        console.error("Error en deleteFile:", error);
        res.status(500).json({
            message: "Error al eliminar el archivo",
            error: error.message,
        });
    }
};
