import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Image = sequelize.define(
    "Image",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        url: { type: DataTypes.STRING, allowNull: false },
        isPrimary: {
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

export default Image;
