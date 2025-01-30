import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
                notNull: true,
            },
        },
        name: { type: DataTypes.STRING, allowNull: false },
        password: { type: DataTypes.STRING, allowNull: false },
        cumpleaños: { type: DataTypes.DATE, allowNull: true },
        role: {
            type: DataTypes.ENUM("admin", "client"),
            defaultValue: "client",
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        plan: {
            type: DataTypes.ENUM("A", "B", "C"),
            allowNull: false,
        },
        capitalInicial: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        capitalActual: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        fechaRegistro: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default User;
