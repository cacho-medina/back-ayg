import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const MovementReport = sequelize.define(
    "MovementReport",
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
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        totalOperaciones: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        gananciaTotal: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        comisionTotal: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        estado: {
            type: DataTypes.ENUM("pendiente", "procesado", "error"),
            defaultValue: "pendiente",
        },
    },
    {
        createdAt: true,
        updatedAt: false,
    }
);

export default MovementReport;
