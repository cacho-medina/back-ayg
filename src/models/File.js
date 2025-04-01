import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const File = sequelize.define(
    "File",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        idUser: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "general",
        },
        link: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    }
);

export default File;
