import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Transaction = sequelize.define(
    "Transaction",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        idUser: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        tipo: {
            type: DataTypes.ENUM("deposito", "retiro"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pendiente", "completado", "cancelado"),
            allowNull: false,
        },
        monto: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        fechaTransaccion: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default Transaction;
