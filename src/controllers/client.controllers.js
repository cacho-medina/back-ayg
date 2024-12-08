import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Report from "../models/Report.js";

export const getClientPortfolio = async (req, res) => {
    try {
        //obtengo el id del usuario que llega mediante el token
        const { id } = req.user;
        const portfolio = await Portfolio.findOne({ where: { userId: id } });
        if (!portfolio) {
            return res
                .status(404)
                .json({ message: "Client portfolio not found" });
        }
        res.status(200).json(portfolio);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Client portfolio not found" });
    }
};

export const getReports = async (req, res) => {
    try {
        const { idPortfolio } = req.params;
        const reports = await Report.findAll({
            where: { idPortfolio },
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Reports not found" });
    }
};

export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Report not found" });
    }
};

export const updatePortfolio = async (req, res) => {
    try {
        const { idPortfolio } = req.params;
        const { plan, montoInversion } = req.body;
        const portfolio = await Portfolio.findByPk(idPortfolio);
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        portfolio.plan = plan || portfolio.plan;
        portfolio.montoInversion = montoInversion || portfolio.montoInversion;
        await portfolio.save();
        res.status(200).json({
            message: "Portfolio updated successfully",
            portfolio,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating portfolio" });
    }
};

export const updateClientProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const { profileImg } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.profileImg = profileImg || user.profileImg;
        await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating profile" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { id } = req.user;
        const { message } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        //funcion para un correo o mensaje al administrador
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending message" });
    }
};
