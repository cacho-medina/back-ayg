import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Portfolio = sequelize.define(
    "Portfolio",
    {
        idPortfolio: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID, // Clave foránea que referencia al modelo User
            allowNull: false,
            references: {
                model: "Users", // Nombre de la tabla Users
                key: "id", // Columna referenciada en la tabla Users
            },
        },
        plan: {
            type: DataTypes.ENUM("A", "B", "C"),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "USDT",
        },
        capitalInicial: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default Portfolio;
