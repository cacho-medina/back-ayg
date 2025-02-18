import MovementItem from "../models/MovementItem.js";

export const getMovements = async (req, res) => {
    try {
        const movements = await MovementItem.findAll({
            order: [["time_open", "DESC"]],
        });
        res.status(200).json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los movimientos" });
    }
};

export const getMovementById = async (req, res) => {
    try {
        const movement = await MovementItem.findByPk(req.params.id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "No se encontró el movimiento solicitado" });
        }
        return res.status(200).json(movement);
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Error al obtener el movimiento" });
    }
};

export const createMovement = async (req, res) => {
    try {
        const {
            number_account,
            currency,
            broker,
            position,
            symbol,
            type,
            volume,
            open_price,
            time_open,
            comission,
            gross_pl,
        } = req.body;

        const movement = await MovementItem.create(req.body);

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
        const movement = await MovementItem.findByPk(req.params.id);
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
        const {
            number_account,
            currency,
            broker,
            position,
            symbol,
            type,
            volume,
            open_price,
            time_open,
            comission,
            gross_pl,
        } = req.body;

        const movement = await MovementItem.findByPk(id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "Movimiento no encontrado" });
        }

        await movement.update(req.body);

        res.status(200).json({
            message: "Movimiento actualizado exitosamente",
            movement,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el movimiento" });
    }
};

//upload movements from excel file
export const uploadMovements = async (req, res) => {
    try {
        const movements = await MovementItem.findAll();
        res.status(200).json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los movimientos" });
    }
};
