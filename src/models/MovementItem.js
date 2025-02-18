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
            type: DataTypes.ENUM("Sell", "buy"),
            allowNull: false,
        },
        volume: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        open_price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        time_open: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        commission: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        gross_pl: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
    }
);

export default MovementItem;
