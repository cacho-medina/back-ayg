import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateJwt from "../helpers/jwt/generateJwt.js";
import {
    sendResetPasswordEmail,
    sendWelcomeEmail,
} from "../helpers/mails/sendEmail.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ message: "credenciales incorrectas" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res
                .status(401)
                .json({ message: "credenciales incorrectas" });
        }
        if (!user.isActive) {
            return res.status(401).json({ message: "usuario suspendido" });
        }
        if (user.isDeleted) {
            return res.status(401).json({ message: "usuario eliminado" });
        }
        const token = generateJwt(user.id, user.email, user.role);

        // Configurar la cookie
        res.cookie("loginAccessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true en producción
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en milisegundos
            path: "/",
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al iniciar sesion" });
    }
};

export const signUpUser = async (req, res) => {
    try {
        const {
            email,
            name,
            password,
            cumpleaños,
            capitalInicial,
            plan,
            fechaRegistro,
            phone,
        } = req.body;

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
            name,
            password: hashedPassword,
            cumpleaños,
            role: "client",
            capitalInicial,
            isActive: true,
            isDeleted: false,
            capitalActual: capitalInicial,
            plan,
            fechaRegistro: fechaRegistro || new Date().toISOString(),
            phone,
        });

        await sendWelcomeEmail(email, name);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};

export const signUpAdmin = async (req, res) => {
    try {
        const {
            email,
            name,
            password,
            cumpleaños,
            capitalInicial,
            plan,
            phone,
        } = req.body;

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
            name,
            password: hashedPassword,
            cumpleaños,
            role: "admin",
            capitalInicial: capitalInicial || 0,
            isActive: true,
            isDeleted: false,
            capitalActual: capitalInicial || 0,
            plan: plan || "A",
            fechaRegistro: new Date().toISOString(),
            phone,
        });

        await sendWelcomeEmail(email, name);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};

export const logout = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        res.status(200).json({ message: "Logout", user });
    } catch (error) {
        console.log(error);
    }
};
export const resetPassword = async (req, res) => {
    try {
        const { password, passwordConfirm } = req.body;

        // Validar que las contraseñas coincidan
        if (password !== passwordConfirm) {
            return res.status(400).json({
                message: "Las contraseñas no coinciden",
            });
        }

        // Buscar y validar usuario
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado",
            });
        }

        // Verificar estado del usuario
        if (!user.isActive || user.isDeleted) {
            return res.status(401).json({
                message: "Usuario no autorizado para realizar esta acción",
            });
        }

        try {
            // Encriptar nueva contraseña
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            // Actualizar contraseña
            user.password = hashedPassword;
            await user.save();

            // Generar nuevo token
            const newToken = generateJwt(user.id, user.email, user.role);

            res.status(200).json({
                message: "Contraseña actualizada exitosamente",
                token: newToken,
            });
        } catch (error) {
            console.error("Error en la encriptación:", error);
            return res.status(500).json({
                message: "Error al actualizar la contraseña",
            });
        }
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({
            message: "Error interno del servidor",
        });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar usuario
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                message: "No existe una cuenta con este email",
            });
        }

        // Generar token JWT que expira en 1 hora
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        // Enviar email
        try {
            await sendResetPasswordEmail(email, resetToken);
            res.status(200).json({
                message:
                    "Si existe una cuenta con este email, recibirás un correo con las instrucciones",
            });
        } catch (error) {
            console.error("Error al enviar email:", error);
            return res.status(500).json({
                message: "Error al enviar el correo de recuperación",
            });
        }
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({
            message: "Error en el proceso de recuperación de contraseña",
        });
    }
};
