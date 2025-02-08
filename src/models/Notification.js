import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        idUser: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("transaction", "report", "alert", "other"),
            defaultValue: "other",
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high"),
            defaultValue: "low",
        },
    },
    {
        timestamps: true,
    }
);

export default Notification;
