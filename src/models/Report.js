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
        idUser: {
            type: DataTypes.UUID, // Clave foránea que referencia User
            allowNull: false,
            references: {
                model: "Users", // Nombre de la tabla de User
                key: "id", // Columna referenciada en User
            },
        },
        renta: {
            //representa la rentabilidad mensual de la inversion en porcentaje
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        gananciaGenerada: {
            //representa la ganancia generada mensual por la inversion
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
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
        balance: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        rentaTotal: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
    }
);

export default Report;
