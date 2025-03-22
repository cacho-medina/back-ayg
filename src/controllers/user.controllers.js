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
                isDeleted: false,
            },
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
        const user = await User.findByPk(req.params.id);
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
        if (user.isDeleted) {
            return res.status(400).json({ message: "Usuario ya eliminado" });
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
        if (user.isDeleted) {
            return res.status(400).json({ message: "Usuario ya eliminado" });
        }
        user.isDeleted = true;
        user.isActive = false;
        await user.save();
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
        if (!user.isDeleted) {
            return res
                .status(400)
                .json({ message: "Usuario no está eliminado" });
        }
        user.isDeleted = false;
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
        if (user.isDeleted) {
            return res.status(400).json({ message: "User is deleted" });
        }
        if (user.isActive === isActive) {
            return res.status(400).json({
                message: `User status is already ${isActive}`,
            });
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
