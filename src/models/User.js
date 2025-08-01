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
        nroCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        secondaryEmail: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        name: { type: DataTypes.STRING, allowNull: false },
        password: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        key: { type: DataTypes.STRING, allowNull: true }, //para clave numerica
        cumpleaños: { type: DataTypes.DATEONLY, allowNull: true },
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
        fechaRegistro: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default User;
