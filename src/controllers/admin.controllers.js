import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Report from "../models/Report.js";
import bcrypt from "bcrypt";
import generateJwt from "../helpers/jwt/generateJwt.js";
import { serialize } from "cookie";
import "../models/relations.js";

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
            include: [
                {
                    model: Portfolio,
                    as: "portfolio",
                    attributes: [
                        "idPortfolio",
                        "plan",
                        "currency",
                        "capitalInicial",
                        "fecha",
                    ],
                },
            ],
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
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Portfolio,
                    as: "portfolio",
                    attributes: [
                        "idPortfolio",
                        "plan",
                        "currency",
                        "capitalInicial",
                        "fecha",
                    ],
                },
            ],
        });
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
        const newPortfolio = await Portfolio.create({
            userId,
            plan,
            currency,
            capitalInicial,
            fecha: new Date(),
        });
        res.status(201).json({
            message: "Client fully associated and activated",
            newPortfolio,
        });
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
        /* const serializedCookie = serialize("loginAccessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        res.setHeader("Set-Cookie", serializedCookie); */

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
        const portfolio = await Portfolio.findOne({ where: { userId: id } });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        //eliminar portfolio del cliente
        await Portfolio.destroy({ where: { userId: id } });
        //eliminar reportes del cliente
        await Report.destroy({ where: { idPortfolio: portfolio.idPortfolio } });
        //eliminar usuario
        await user.destroy();
        res.status(200).json({
            message: "User and portfolio deleted successfully",
        });
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

///////////////////OBTENER TODOS LOS PORTFOLIOS///////////////////
export const getPortfolio = async (req, res) => {
    // Establece los valores predeterminados para página y límite
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const { count, rows: portfolios } = await Portfolio.findAndCountAll({
            limit,
            offset,
        });
        // Calcula el número total de páginas
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            portfolios,
            currentPage: page,
            totalPages,
            totalPortfolios: count,
        });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Portfolios not found" });
    }
};

/////////////////CRUD DE REPORTES///////////////////

export const getReports = async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting reports" });
    }
};

export const getReportByClientId = async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { idPortfolio: req.params.id },
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting reports" });
    }
};

export const getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                {
                    model: Portfolio,
                    as: "portfolio",
                    attributes: [
                        "idPortfolio",
                        "plan",
                        "currency",
                        "capitalInicial",
                        "fecha",
                    ],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"], // Solo incluimos estos campos del usuario
                        },
                    ],
                },
            ],
        });
        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting report" });
    }
};

export const createReport = async (req, res) => {
    const { id, idPortfolio, gananciaGenerada, extraccion, renta } = req.body;
    try {
        const client = await User.findByPk(id);
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }
        const portfolio = await Portfolio.findByPk(idPortfolio);
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const report = await Report.create({
            idPortfolio,
            gananciaGenerada,
            extraccion: extraccion || 0,
            renta,
            fecha: new Date(),
            numeroInforme: 1,
        });
        res.status(201).json({ message: "Report created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating report" });
    }
};

export const deleteReport = async (req, res) => {
    try {
        await Report.destroy({ where: { id: req.params.id } });
        res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting report" });
    }
};
