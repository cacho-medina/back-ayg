import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
            notNull: true,
        },
    },
    password: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    profileImg: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isUrl: true },
    },
    googleId: { type: DataTypes.STRING, unique: true, allowNull: true },
    role: {
        type: DataTypes.ENUM("admin", "client"),
        defaultValue: "user",
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
});

export default User;
