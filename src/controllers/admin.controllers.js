import User from "../models/User.js";
import Report from "../models/Report.js";
import "../models/relations.js";
import { sendReportEmail } from "../helpers/mails/sendEmail.js";
import sequelize from "../config/db.js";

export const getClients = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: "client" },
            order: [["fechaRegistro", "DESC"]],
        });

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Users not found" });
    }
};

export const getReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [["fechaEmision", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting reports" });
    }
};

export const getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });

        if (!report) {
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el reporte" });
    }
};

export const getReportByUserId = async (req, res) => {
    try {
        const report = await Report.findAll({
            where: { idUser: req.params.idUser },
            order: [["fechaEmision", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting report" });
    }
};

export const createReport = async (req, res) => {
    const { idUser, renta, gananciaGenerada, fechaEmision, extraccion } =
        req.body;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const report = await Report.create(
            {
                idUser,
                renta,
                gananciaGenerada,
                fechaEmision: new Date(fechaEmision),
                extraccion,
            },
            { transaction: t }
        );

        if (extraccion > 0) {
            user.capitalActual -= extraccion;
            await user.save({ transaction: t });
        }

        user.capitalActual += gananciaGenerada;
        await user.save({ transaction: t });

        await t.commit();

        await sendReportEmail(user.email, user.name);

        res.status(201).json({
            message: "Reporte creado exitosamente",
            report,
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al crear el reporte" });
    }
};

export const deleteReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const report = await Report.findByPk(req.params.id, { transaction: t });
        if (!report) {
            await t.rollback();
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        const user = await User.findByPk(report.idUser, { transaction: t });
        user.capitalActual -= report.gananciaGenerada;
        if (report.extraccion > 0) {
            user.capitalActual += report.extraccion;
        }

        await user.save({ transaction: t });
        await report.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: "Reporte eliminado exitosamente" });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el reporte" });
    }
};
