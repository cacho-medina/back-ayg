import MovementReport from "../models/MovementReport.js";
import MovementItem from "../models/MovementItem.js";
import User from "../models/User.js";
import sequelize from "../config/db.js";

export const createMovementReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idUser, movements } = req.body;

        // Verificar usuario
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Calcular totales
        const totalOperaciones = movements.length;
        const gananciaTotal = movements.reduce(
            (sum, mov) => sum + mov.gross_pl,
            0
        );
        const comisionTotal = movements.reduce(
            (sum, mov) => sum + mov.commission,
            0
        );

        // Crear reporte
        const report = await MovementReport.create(
            {
                idUser,
                totalOperaciones,
                gananciaTotal,
                comisionTotal,
            },
            { transaction: t }
        );

        // Crear movimientos asociados
        const movementPromises = movements.map((movement) =>
            MovementItem.create(
                {
                    ...movement,
                    idMovementReport: report.id,
                },
                { transaction: t }
            )
        );

        await Promise.all(movementPromises);

        await t.commit();

        res.status(201).json({
            message: "Reporte de movimientos creado exitosamente",
            report,
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            message: "Error al crear el reporte de movimientos",
            error: error.message,
        });
    }
};

export const getMovementReports = async (req, res) => {
    try {
        const reports = await MovementReport.findAll({
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "email"],
                },
                {
                    model: MovementItem,
                    as: "movements",
                },
            ],
            order: [["fecha", "DESC"]],
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los reportes de movimientos",
            error: error.message,
        });
    }
};

export const getMovementReportById = async (req, res) => {
    try {
        const report = await MovementReport.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "email"],
                },
                {
                    model: MovementItem,
                    as: "movements",
                },
            ],
        });

        if (!report) {
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener el reporte",
            error: error.message,
        });
    }
};

export const deleteMovementReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const report = await MovementReport.findByPk(req.params.id, {
            transaction: t,
        });

        if (!report) {
            await t.rollback();
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        // Eliminar movimientos asociados
        await MovementItem.destroy({
            where: { idMovementReport: report.id },
            transaction: t,
        });

        // Eliminar el reporte
        await report.destroy({ transaction: t });

        await t.commit();

        res.status(200).json({ message: "Reporte eliminado exitosamente" });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            message: "Error al eliminar el reporte",
            error: error.message,
        });
    }
};
