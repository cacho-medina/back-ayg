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
        fechaEmision: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_DATE"),
        },
        number_account: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "USD",
        },
        broker: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "NinjaTrader LLC",
        },
        rentabilidad_total: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        rentabilidad_personal: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        gastos_operativos: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        beneficio_empresa: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        desgravamen: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        open_frame: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        close_frame: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export default MovementReport;
