import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const MovementItem = sequelize.define(
    "MovementItem",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        position: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        symbol: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "US.100",
        },
        type: {
            type: DataTypes.ENUM("sell", "buy"),
            allowNull: false,
        },
        volume: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        open_price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        time_open: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        commission: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        gross_pl: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        idMovementReport: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "MovementReports",
                key: "id",
            },
        },
    },
    {
        timestamps: false,
    }
);

export default MovementItem;
