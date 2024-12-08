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
