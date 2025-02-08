import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
    sendTransactionConfirmationEmail,
    sendTransactionRequestEmail,
} from "../helpers/mails/sendEmail.js";

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            order: [["fechaTransaccion", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting transactions" });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting transaction" });
    }
};

export const getTransactionByUserId = async (req, res) => {
    try {
        const transaction = await Transaction.findAll({
            where: { idUser: req.params.idUser },
            order: [["fechaTransaccion", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name", "plan", "capitalActual"],
                },
            ],
        });
        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting transaction" });
    }
};

export const extraccion = async (req, res) => {
    try {
        const { idUser, monto, fechaTransaccion } = req.body;
        const user = await User.findByPk(idUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.capitalActual < monto) {
            return res
                .status(400)
                .json({ message: "User does not have enough capital" });
        }

        user.capitalActual -= monto;
        await user.save();

        const transaction = await Transaction.create({
            idUser,
            monto,
            tipo: "retiro",
            fechaTransaccion: new Date(fechaTransaccion).toISOString(),
            status: "pendiente",
        });

        await sendTransactionRequestEmail(
            user.email,
            user.name,
            "retiro",
            monto,
            fechaTransaccion,
            user.phone,
            transaction.id
        );

        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating transaction" });
    }
};
export const deposito = async (req, res) => {
    try {
        const { idUser, monto, fechaTransaccion } = req.body;
        const user = await User.findByPk(idUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transaction = await Transaction.create({
            idUser,
            monto,
            tipo: "deposito",
            fechaTransaccion: new Date(fechaTransaccion).toISOString(),
            status: "pendiente",
        });

        await sendTransactionRequestEmail(
            user.email,
            user.name,
            "deposito",
            monto,
            fechaTransaccion,
            user.phone,
            transaction.id
        );

        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating transaction" });
    }
};

export const confirmDeposito = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (transaction.status !== "pendiente") {
            return res
                .status(400)
                .json({ message: "Transaction is not pending" });
        }
        transaction.status = "completado";
        await transaction.save();

        const user = await User.findByPk(transaction.idUser);
        user.capitalActual += transaction.monto;
        await user.save();

        await sendTransactionConfirmationEmail(
            user.email,
            user.name,
            transaction.tipo,
            transaction.monto,
            transaction.fechaTransaccion
        );

        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error confirming transaction" });
    }
};
export const confirmExtraccion = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (transaction.status !== "pendiente") {
            return res
                .status(400)
                .json({ message: "Transaction is not pending" });
        }
        transaction.status = "completado";
        await transaction.save();

        const user = await User.findByPk(transaction.idUser);
        user.capitalActual -= transaction.monto;
        await user.save();

        await sendTransactionConfirmationEmail(
            user.email,
            user.name,
            transaction.tipo,
            transaction.monto,
            transaction.fechaTransaccion
        );

        res.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error confirming transaction" });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        await transaction.destroy();
        res.status(200).json({ message: "Transaction deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting transaction" });
    }
};
