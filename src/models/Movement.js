import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Movement = sequelize.define(
    "Movement",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        idReport: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Reports",
                key: "id",
            },
        },
        fechaOperacion: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        precioEntrada: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        precioSalida: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        puntosGanados: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default Movement;
