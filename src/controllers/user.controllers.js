import User from "../models/User.js";

//obtener todos los usuarios, tanto admins y clientes
export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Error al obtener los usuarios" });
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
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        await user.update(req.body);
        res.status(200).json({ message: "Usuario actualizado correctamente" });
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
            return res
                .status(400)
                .json({ message: "User status is already updated" });
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
