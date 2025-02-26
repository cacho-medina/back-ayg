import MovementReport from "../models/MovementReport.js";
import MovementItem from "../models/MovementItem.js";
import User from "../models/User.js";
import sequelize from "../config/db.js";

export const createMovementReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            number_account,
            currency,
            broker,
            rentabilidad_total,
            rentabilidad_personal,
            gastos_operativos,
            beneficio_empresa,
            desgravamen,
            open_frame,
            close_frame,
            comision_total,
            movements, // Array de IDs de movimientos
        } = req.body;

        // Verificar que existan todos los movimientos
        const existingMovements = await MovementItem.findAll({
            where: {
                id: movements,
            },
            transaction: t,
        });

        if (existingMovements.length !== movements.length) {
            await t.rollback();
            return res.status(404).json({
                message: "Algunos movimientos no fueron encontrados",
            });
        }

        // Crear reporte
        const report = await MovementReport.create(
            {
                number_account,
                currency,
                broker,
                rentabilidad_total,
                rentabilidad_personal,
                gastos_operativos,
                beneficio_empresa,
                desgravamen,
                open_frame,
                close_frame,
                comision_total,
                fechaEmision: new Date().toISOString().split("T")[0],
            },
            { transaction: t }
        );

        // Actualizar los movimientos con el ID del reporte
        await MovementItem.update(
            { idMovementReport: report.id },
            {
                where: {
                    id: movements,
                },
                transaction: t,
            }
        );

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;
        const { count, rows: reports } = await MovementReport.findAndCountAll({
            include: [
                {
                    model: MovementItem,
                    as: "movements",
                    order: [["time_open", "DESC"]],
                },
            ],
            order: [["fechaEmision", "DESC"]],
            limit,
            offset,
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            reports,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
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
                    order: [["time_open", "DESC"]],
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

        // Actualizar los movimientos para eliminar la asociación
        await MovementItem.update(
            { idMovementReport: null },
            {
                where: { idMovementReport: report.id },
                transaction: t,
            }
        );

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

export const updateMovementReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            idUser,
            movements,
            number_account,
            currency,
            broker,
            rentabilidad_total,
            rentabilidad_personal,
            gastos_operativos,
            beneficio_empresa,
            desgravamen,
            open_frame,
            close_frame,
            comision_total,
        } = req.body;

        // Verificar usuario
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Buscar y actualizar reporte
        const report = await MovementReport.findByPk(req.params.id, {
            transaction: t,
        });

        if (!report) {
            await t.rollback();
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        // Actualizar datos del reporte
        await report.update(
            {
                idUser,
                number_account,
                currency,
                broker,
                rentabilidad_total,
                rentabilidad_personal,
                gastos_operativos,
                beneficio_empresa,
                desgravamen,
                open_frame,
                close_frame,
                comision_total,
            },
            { transaction: t }
        );

        if (movements) {
            // Eliminar asociaciones anteriores
            await MovementItem.update(
                { idMovementReport: null },
                {
                    where: { idMovementReport: report.id },
                    transaction: t,
                }
            );

            // Verificar que existan todos los movimientos
            const existingMovements = await MovementItem.findAll({
                where: { id: movements },
                transaction: t,
            });

            if (existingMovements.length !== movements.length) {
                await t.rollback();
                return res.status(404).json({
                    message: "Algunos movimientos no fueron encontrados",
                });
            }

            // Crear nuevas asociaciones
            await MovementItem.update(
                { idMovementReport: report.id },
                {
                    where: { id: movements },
                    transaction: t,
                }
            );
        }

        await t.commit();

        res.status(200).json({
            message: "Reporte actualizado exitosamente",
            report,
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar el reporte",
            error: error.message,
        });
    }
};
