import Movement from "../models/Movement.js";
import Report from "../models/Report.js";

export const getMovements = async (req, res) => {
    try {
        const movements = await Movement.findAll({
            order: [["fechaOperacion", "DESC"]],
            include: [
                {
                    model: Report,
                    as: "report",
                    attributes: ["fechaEmision"],
                },
            ],
        });
        res.status(200).json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los movimientos" });
    }
};

export const getMovementsByReportId = async (req, res) => {
    try {
        const movements = await Movement.findAll({
            where: { idReport: req.params.idReport },
            order: [["fechaOperacion", "DESC"]],
        });
        res.status(200).json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los movimientos del reporte",
        });
    }
};

export const createMovement = async (req, res) => {
    try {
        const {
            idReport,
            fechaOperacion,
            precioEntrada,
            precioSalida,
            puntosGanados,
        } = req.body;

        const movement = await Movement.create({
            idReport,
            fechaOperacion: new Date(fechaOperacion).toISOString(),
            precioEntrada,
            precioSalida,
            puntosGanados,
        });

        res.status(201).json({
            message: "Movimiento creado exitosamente",
            movement,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el movimiento" });
    }
};

export const deleteMovement = async (req, res) => {
    try {
        const movement = await Movement.findByPk(req.params.id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "Movimiento no encontrado" });
        }
        await movement.destroy();
        res.status(200).json({ message: "Movimiento eliminado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el movimiento" });
    }
};

export const updateMovement = async (req, res) => {
    try {
        const { id } = req.params;
        const { fechaOperacion, precioEntrada, precioSalida, puntosGanados } =
            req.body;

        const movement = await Movement.findByPk(id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "Movimiento no encontrado" });
        }

        await movement.update({
            fechaOperacion: new Date(fechaOperacion).toISOString(),
            precioEntrada,
            precioSalida,
            puntosGanados,
        });

        res.status(200).json({
            message: "Movimiento actualizado exitosamente",
            movement,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el movimiento" });
    }
};
