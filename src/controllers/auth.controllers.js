import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateJwt from "../helpers/jwt/generateJwt.js";
import {
    sendResetPasswordEmail,
    sendWelcomeEmail,
} from "../helpers/mails/sendEmail.js";
import sequelize from "../config/db.js";
import Report from "../models/Report.js";

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
    const t = await sequelize.transaction();

    try {
        const {
            email,
            nroCliente,
            name,
            password,
            birthday,
            capitalInicial,
            plan,
            fechaRegistro,
            phone,
            currency,
        } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            where: { email, nroCliente },
            transaction: t,
        });

        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: "User already exists" });
        }

        // Encriptar la contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Crear nuevo usuario
        const user = await User.create(
            {
                email,
                name,
                nroCliente,
                password: hashedPassword,
                cumpleaños: birthday,
                role: "client",
                capitalInicial,
                isActive: true,
                isDeleted: false,
                capitalActual: capitalInicial,
                plan,
                fechaRegistro:
                    fechaRegistro || new Date().toISOString().split("T")[0],
                phone,
                currency,
            },
            { transaction: t }
        );

        // Enviar email de bienvenida
        await sendWelcomeEmail(email, name, password);

        // Crear un reporte inicial para el usuario
        const report = await Report.create(
            {
                idUser: user.id,
                fechaEmision:
                    user.fechaRegistro ||
                    new Date().toISOString().split("T")[0],
                renta: 0,
                gananciaGenerada: 0,
                balance: user.capitalActual,
                rentaTotal: 0,
            },
            { transaction: t }
        );

        // Si todo sale bien, confirmar la transacción
        await t.commit();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                currency: user.currency,
            },
        });
    } catch (error) {
        // Si hay algún error, revertir la transacción
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};

export const signUpAdmin = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            email,
            name,
            password,
            cumpleaños,
            capitalInicial,
            plan,
            phone,
            currency,
            nroCliente,
        } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            where: { email },
            transaction: t,
        });

        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: "User already exists" });
        }

        // Encriptar la contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Crear nuevo usuario
        const user = await User.create(
            {
                email,
                name,
                nroCliente,
                password: hashedPassword,
                cumpleaños,
                role: "admin",
                capitalInicial: capitalInicial || 0,
                isActive: true,
                isDeleted: false,
                capitalActual: capitalInicial || 0,
                plan: plan || "A",
                fechaRegistro: new Date().toISOString().split("T")[0],
                phone,
                currency,
            },
            { transaction: t }
        );

        try {
            // Enviar email de bienvenida
            await sendWelcomeEmail(email, name);
        } catch (emailError) {
            // Log del error pero continuamos con la transacción
            console.error("Error enviando email de bienvenida:", emailError);
        }

        // Confirmar la transacción
        await t.commit();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                currency: user.currency,
            },
        });
    } catch (error) {
        // Revertir la transacción en caso de error
        await t.rollback();
        console.error("Error en signUpAdmin:", error);
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
