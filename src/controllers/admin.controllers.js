import User from "../models/User.js";
import Report from "../models/Report.js";
import "../models/relations.js";
import { sendReportEmail } from "../helpers/mails/sendEmail.js";
import Movement from "../models/Movement.js";

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
                {
                    model: Movement,
                    as: "movements",
                    attributes: [
                        "id",
                        "fechaOperacion",
                        "precioEntrada",
                        "precioSalida",
                        "puntosGanados",
                    ],
                    order: [["fechaOperacion", "DESC"]],
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
    const { idUser, renta, gananciaGenerada, fechaEmision } = req.body;
    try {
        const user = await User.findByPk(idUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const report = await Report.create({
            idUser,
            renta,
            gananciaGenerada,
            fechaEmision: new Date(fechaEmision).toISOString(),
        });

        //actualizar datos del usuario
        user.capitalActual += gananciaGenerada;
        await user.save();

        await sendReportEmail(user.email, user.name);

        res.status(201).json({
            message: "Report created successfully",
            report,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating report" });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        await report.destroy();
        res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting report" });
    }
};
