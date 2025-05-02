import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendCustomEmail } from "../helpers/mails/sendEmail.js";
import File from "../models/File.js";
import Plan from "../models/Plan.js";
import Transaction from "../models/Transaction.js";
import calcularRenta from "../utils/calcularRenta.js";
import calcularRentaTotal from "../utils/calcularRentaTotal.js";
import { calcularCrecimiento } from "../utils/calcularCrecimiento.js";

const obtenerMes = (fecha) => {
    return new Intl.DateTimeFormat("es-ES", {
        month: "short",
        timeZone: "UTC",
    }).format(new Date(fecha));
};

export const getEstadisticas = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();

        // Calcular primer día del mes actual y del mes anterior
        const inicioMesActual = new Date(currentYear, currentMonth, 1);
        const inicioMesSiguiente = new Date(currentYear, currentMonth + 1, 1);

        // Calcular la fecha de inicio para los últimos 12 meses (inicio del mes hace un año)
        const inicioHaceUnAnio = new Date(inicioMesActual);
        inicioHaceUnAnio.setUTCFullYear(inicioMesActual.getUTCFullYear() - 1);

        //balance total, capital inicial y usuarios activos
        const [balanceTotal, usuariosActivos, capitalInicial] =
            await Promise.all([
                Plan.sum("capitalActual", {
                    where: {
                        isCurrent: true,
                    },
                    transaction: t,
                }),
                User.count({
                    where: {
                        isActive: true,
                        role: "client",
                    },
                    transaction: t,
                }),
                Plan.sum("capitalInicial", {
                    where: {
                        isCurrent: true,
                    },
                    transaction: t,
                }),
            ]);

        //transacciones del ultimo mes
        const transaccionesUltimoMes = await Transaction.findOne({
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
        });
        //ganancia y reportes del ultimo mes
        const [gananciaUltimoMes, reportesUltimoMes, capitalInicialUltimoMes] =
            await Promise.all([
                Report.sum("ganancia", {
                    where: {
                        fechaEmision: {
                            [Op.lt]: inicioMesActual,
                        },
                    },
                    transaction: t,
                }),
                Report.count({
                    where: {
                        fechaEmision: {
                            [Op.gte]: inicioMesActual,
                            [Op.lt]: inicioMesSiguiente,
                        },
                    },
                    transaction: t,
                }),
                Report.sum("montoInicial", {
                    where: {
                        fechaEmision: {
                            [Op.lt]: inicioMesActual,
                        },
                    },
                    transaction: t,
                }),
            ]);

        const reportesGenerados = await Report.count();

        const monthlyStats = await Report.findAll({
            where: {
                fechaEmision: {
                    [Op.gte]: inicioHaceUnAnio, // Filtra desde hace un año
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
                [sequelize.fn("SUM", sequelize.col("ganancia")), "ganancia"],
                [sequelize.fn("SUM", sequelize.col("capitalFinal")), "balance"],
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
            fecha: obtenerMes(stat.dataValues.mes),
            balance: parseFloat(stat.dataValues.balance),
            ganancia: parseFloat(stat.dataValues.ganancia),
            rentabilidad: calcularRenta(
                stat.dataValues.ganancia,
                capitalInicial
            ),
        }));

        await t.commit();

        res.status(200).json({
            capitalTotal: balanceTotal,
            reportesGenerados,
            renta: calcularRenta(gananciaUltimoMes, capitalInicialUltimoMes),
            dataMensual: {
                reportes: reportesUltimoMes,
                transacciones: transaccionesUltimoMes,
            },
            usuariosActivos,
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
    try {
        const { idUser } = req.params;
        const plan = await Plan.findOne({ where: { idUser } });
        if (!plan) {
            return res.status(404).json({
                message: "No existe el plan",
            });
        }

        const reports = await Report.findAll({
            where: {
                idPlan: plan.id,
            },
            attributes: ["fechaEmision", "renta", "ganancia", "capitalFinal"],
            order: [["fechaEmision", "ASC"]],
        });

        const gananciaAcumulada = reports.reduce(
            (acumulado, report) => acumulado + report.ganancia,
            0
        );

        const transactions = await Transaction.findAll({
            where: {
                idPlan: plan.id,
            },
            attributes: ["fechaTransaccion", "monto", "tipo"],
            order: [["fechaTransaccion", "ASC"]],
        });

        const ingresoAcumulado = transactions.reduce(
            (acumulado, transaction) =>
                acumulado +
                (transaction.tipo === "deposito" ? transaction.monto : 0),
            0
        );

        const rentaTotal = calcularRenta(
            gananciaAcumulada,
            plan.capitalActual - ingresoAcumulado
        );

        const dataMensual = reports.map((report) => ({
            fecha: report.fechaEmision,
            mes: obtenerMes(report.fechaEmision),
            renta: report.renta.toFixed(2),
            ganancia: report.ganancia,
            balance: report.capitalFinal,
        }));

        const dataMensualFinal =
            dataMensual.length >= 12
                ? dataMensual.slice(-12) // Obtiene los últimos 12 elementos
                : dataMensual;

        res.status(200).json({
            montoTotal: plan.capitalActual,
            dataMensual: dataMensualFinal,
            rentaTotal: rentaTotal.toFixed(2),
        });
    } catch (error) {
        console.error("Error en getEstadisticasByUser:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas por usuario",
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
        const { titulo, proposito, idUser } = req.body;
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
                name: titulo || req.file.filename,
                type: proposito,
                link: `${process.env.BACKEND_URL}/uploads/${titulo}`,
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
