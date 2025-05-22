import Plan from "../models/Plan.js";
import User from "../models/User.js";
import { Op } from "sequelize";

//obtener todos los usuarios, tanto admins y clientes
export const getUsers = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        // Parámetros de filtrado
        const { search, plan, sort } = req.query;

        // Construir objeto de filtros
        const where = {};

        // Búsqueda por nombre, email o nroCliente
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { nroCliente: { [Op.iLike]: `%${search}%` } },
            ];
        }
        if (plan) {
            where.plan = plan;
        }

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_asc") {
            order.push(["fechaRegistro", "ASC"]);
        } else {
            order.push(["fechaRegistro", "DESC"]);
        }

        // Realizar la consulta con paginación y filtros
        const { count, rows: users } = await User.findAndCountAll({
            where,
            order,
            limit,
            offset,
            attributes: {
                exclude: ["password"], // Excluir el campo password de la respuesta
                include: [
                    {
                        model: Plan,
                        attributes: [
                            "periodo",
                            "capitalInicial",
                            "isCurrent",
                            "currency",
                        ],
                    },
                ],
            },
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            users,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los usuarios",
            error: error.message,
        });
    }
};

export const getUserByName = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                name: { [Op.iLike]: `%${req.params.name}%` },
                isActive: true,
            },
            include: [
                {
                    model: Plan,
                    as: "plans",
                    attributes: ["periodo", "capitalInicial", "isCurrent"],
                },
            ],
        });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al obtener el usuario" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Plan,
                    as: "plans",
                    attributes: [
                        "id",
                        "periodo",
                        "capitalInicial",
                        "isCurrent",
                        "capitalActual",
                        "fechaInicio",
                        "currency",
                    ],
                },
            ],
        });
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al obtener el usuario" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { name, email, cumpleaños, phone } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (!user.isActive) {
            return res.status(400).json({ message: "Usuario inactivo" });
        }
        await user.update({
            name: name || user.name,
            email: email || user.email,
            cumpleaños: cumpleaños || user.cumpleaños,
            phone: phone || user.phone,
        });
        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al actualizar el usuario" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (user.isActive) {
            return res.status(400).json({ message: "Usuario activo" });
        }
        await user.destroy();
        res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al eliminar el usuario" });
    }
};
export const activateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (user.isActive) {
            return res.status(400).json({ message: "Usuario ya está activo" });
        }
        user.isActive = true;
        await user.save();
        res.status(200).json({ message: "Usuario activado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al activar el usuario" });
    }
};

export const changeUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.isActive === isActive) {
            return res.status(400).json({
                message: `User status is already ${isActive}`,
            });
        }
        const plan = await Plan.findOne({
            where: {
                idUser: id,
            },
        });
        //si el usuario tiene un plan actual activo, se desactiva
        if (plan && plan.isCurrent) {
            plan.isCurrent = isActive;
            await plan.save();
        }
        // Cambiar estado activo del usuario
        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            message: `User status updated successfully`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user status" });
    }
};

export const editUserPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            planId,
            capitalActual,
            capitalInicial,
            fechaInicio,
            currency,
            periodo,
            isCurrent,
        } = req.body;

        if (!planId) {
            return res.status(400).json({
                message: "Se requiere planId para actualizar el plan",
            });
        }
        //veridica que el usuario exista
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        //veridica que el plan exista
        const plan = await Plan.findByPk(planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan no encontrado" });
        }
        //veridica que el plan no este inactivo
        if (!plan.isCurrent) {
            return res.status(400).json({ message: "Plan actual no activo" });
        }
        //veridica que el plan este asociado al usuario
        if (plan.idUser !== id) {
            return res
                .status(400)
                .json({ message: "Plan no asociado a usuario" });
        }
        // Solo actualizar los campos enviados
        const updates = {};
        if (capitalActual !== "") updates.capitalActual = Number(capitalActual);
        if (capitalInicial !== "")
            updates.capitalInicial = Number(capitalInicial);
        if (fechaInicio !== "") updates.fechaInicio = fechaInicio;
        if (currency !== "") updates.currency = currency;
        if (periodo !== "") updates.periodo = periodo;
        if (isCurrent !== "") updates.isCurrent = isCurrent;

        await plan.update(updates);
        res.status(200).json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al editar el usuario" });
    }
};

/* export const createUserPlan = async (req, res) => {
        try {
            const { id } = req.params;
            const { planId } = req.body;
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al crear el plan" });
        }
    }; */
