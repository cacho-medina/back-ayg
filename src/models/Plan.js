import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Plan = sequelize.define(
    "Plan",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        periodo: { type: DataTypes.STRING, allowNull: false },
        currency: { type: DataTypes.STRING, allowNull: false },
        capitalInicial: { type: DataTypes.DOUBLE, allowNull: false },
        capitalActual: { type: DataTypes.DOUBLE, allowNull: false },
        fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
        isCurrent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        idUser: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
    },
    {
        timestamps: false,
    }
);

export default Plan;
