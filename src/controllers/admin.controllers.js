import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateJwt from "../helpers/jwt/generateJwt.js";
import { serialize } from "cookie";
import Portfolio from "../models/Portfolio.js";

///////////////////OBTENER DATOS DE CLIENTES///////////////////
//si se realiza una consulta sin especificar los parametros
//se utilizaran los valores predeterminados: page -> 1 - limit -> 10

function searchClientByName(name) {
    whereCondition.name = {
        [Op.iLike]: `%${name}%`, // Búsqueda parcial, insensible a mayúsculas
    };
}

export const getClients = async (req, res) => {
    // Establece los valores predeterminados para página y límite
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { name } = req.query;

    try {
        const whereCondition = { role: "client" };
        //si se busca un nombre en especifico se agrega la condicion a la sentencia
        if (name) {
            searchClientByName(name);
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereCondition,
            limit, // Máximo número de registros a retornar
            offset, // Número de registros a omitir desde el inicio
        });

        // Calcula el número total de páginas
        const totalPages = Math.ceil(count / limit);

        // Devuelve la lista de usuarios junto con información de paginación
        res.json({
            users,
            currentPage: page,
            totalPages,
            totalUsers: count,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Users not found" });
    }
};

export const getClientById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "User not found" });
    }
};

///////////////////REGISTROS DE USUARIOS///////////////////
export const signUpUser = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Encriptar la contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Crear nuevo usuario
        const user = await User.create({
            email,
            password: hashedPassword,
            role,
            name,
            isActive: true,
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};

export const asocciateClientPlan = async (req, res) => {
    try {
        const { userId, plan, currency, capitalInicial } = req.body;
        //comprueba si ya existe un cliente registrado con ese plan de inversion
        const userRegistered = await Portfolio.findOne({
            where: { userId, plan },
        });
        if (userRegistered) {
            return res
                .status(400)
                .json({ message: "User is already registered in this plan" });
        }
        //asociar cliente con el plan
        const newUserPortfolio = await Portfolio.create({
            userId,
            plan,
            currency,
            capitalInicial,
        });
        res.status(201).json({ message: "Client asocciated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error at asocciating client with plan",
        });
    }
};

///////////////////INICIO DE SESION DE USUARIOS///////////////////
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar si el usuario existe
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(401)
                .json({ message: "username o password incorrecto" });
        }

        // Validar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: "username o password incorrecto" });
        }

        // Validar si el usuario está activo
        if (!user.isActive) {
            return res.status(401).json({ message: "Usuario suspendido" });
        }

        // Generar token JWT
        const token = generateJwt(user.id, user.email, user.role);
        //enviar token en cabecera de la response mediante una cookie con el modulo cookie
        //serializa el token
        const serializedCookie = serialize("loginAccessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "development",
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        res.setHeader("Set-Cookie", serializedCookie);

        //actualmente se esta enviando el token dentro del cuerpo de la respuesta
        res.status(200).json({
            message: `User logged in as ${user.role}!`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token, //borrar del cuerpo de response al entrar en production
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error at login user" });
    }
};

///////////////////CIERRE DE SESION DE USUARIOS///////////////////
export const logout = async (req, res) => {
    try {
        //enviar token en cabecera de la response mediante una cookie con el modulo cookie
        //serializa el token
        const serializedCookie = serialize("loginAccessToken", null, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "development",
            sameSite: "none",
            maxAge: 0,
            path: "/",
        });

        res.setHeader("Set-Cookie", serializedCookie);

        //actualmente se esta enviando el token dentro del cuerpo de la respuesta
        res.status(200).json({
            message: "User logged out succesfully!",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error at logout" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting user" });
    }
};

///////////////////ACTUALIZACION DE USUARIOS///////////////////
//actualizar informacion del usuario

export const updateUserInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, profileImg } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Actualizar información del usuario
        user.name = name || user.name;
        user.email = email || user.email;
        user.profileImg = profileImg || user.profileImg;

        await user.save();

        res.status(200).json({
            message: "User information updated successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user information" });
    }
};

///////////////////ACTIVAR/DESACTIVAR USUARIOS///////////////////
export const changeUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Cambiar estado activo del usuario
        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            message: `User status updated successfully`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user status" });
    }
};
