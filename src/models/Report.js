import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Report = sequelize.define(
    "Report",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        renta: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        montoInicial: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        ganancia: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        fechaEmision: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_DATE"), // Fecha actual por defecto
        },
        extraccion: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        deposito: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        capitalFinal: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        rentabilidadTotal: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        nroReporte: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        idPlan: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Plans",
                key: "id",
            },
        },
    },
    {
        timestamps: false,
    }
);

export default Report;
