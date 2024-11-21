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
        idPortfolio: {
            type: DataTypes.UUID, // Clave foránea que referencia Portfolio
            allowNull: false,
            references: {
                model: "Portfolios", // Nombre de la tabla de Portfolio
                key: "idPortfolio", // Columna referenciada en Portfolio
            },
        },
        renta: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: {
                min: 0,
                max: 1, // Asegura que esté en el rango de 0 a 1
            },
            comment: "Renta mensual en valores porcentuales (0.25 = 25%)",
        },
        capital: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        gananciaGenerada: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        extraccion: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW, // Fecha actual por defecto
        },
        numeroInforme: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default Report;
