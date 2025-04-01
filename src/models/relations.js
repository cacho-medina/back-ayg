import User from "./User.js";
import Report from "./Report.js";
import Transaction from "./Transaction.js";
import Notification from "./Notification.js";
import File from "./File.js";
import Image from "./Image.js";
import Plan from "./Plan.js";

User.hasMany(Image, { foreignKey: "idUser", onDelete: "CASCADE" });
Image.belongsTo(User, { foreignKey: "idUser" });

User.hasMany(Plan, { foreignKey: "idUser", as: "plans", onDelete: "CASCADE" });
Plan.belongsTo(User, { foreignKey: "idUser", as: "user" });

Plan.hasMany(Report, {
    foreignKey: "idPlan",
    as: "reports",
    onDelete: "CASCADE",
});
Report.belongsTo(Plan, { foreignKey: "idPlan", as: "plan" });

User.hasMany(File, { foreignKey: "idUser", onDelete: "CASCADE" });
File.belongsTo(User, { foreignKey: "idUser" });

Plan.hasMany(Transaction, {
    foreignKey: "idPlan",
    as: "transactions",
    onDelete: "CASCADE",
});
Transaction.belongsTo(Plan, { foreignKey: "idPlan", as: "plan" });

User.hasMany(Notification, { foreignKey: "idUser", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "idUser" });

export default {
    User,
    Report,
    Transaction,
    Notification,
    File,
    Image,
    Plan,
};
