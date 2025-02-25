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
            type: DataTypes.DATE,
            allowNull: false,
        },
        close_frame: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        createdAt: true,
        updatedAt: false,
    }
);

export default MovementReport;
