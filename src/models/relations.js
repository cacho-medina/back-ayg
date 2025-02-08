import User from "./User.js";
import Report from "./Report.js";
import Transaction from "./Transaction.js";
import Movement from "./Movement.js";
import Notification from "./Notification.js";
import File from "./File.js";

// Relación: Un User tiene muchos Reports
User.hasMany(Report, {
    foreignKey: "idUser",
    as: "reports",
    onDelete: "CASCADE", // Si se elimina un usuario, se eliminan sus reportes
});

// Relación: Un Report pertenece a un User
Report.belongsTo(User, {
    foreignKey: "idUser",
    as: "user",
});

// Relación: Un User tiene muchas Transactions
User.hasMany(Transaction, {
    foreignKey: "idUser",
    as: "transactions",
    onDelete: "CASCADE", // Si se elimina un usuario, se eliminan sus transacciones
});

// Relación: Una Transaction pertenece a un User
Transaction.belongsTo(User, {
    foreignKey: "idUser",
    as: "user",
});

// Relación: Un Report tiene muchos Movements
Report.hasMany(Movement, {
    foreignKey: "idReport",
    as: "movements",
    onDelete: "CASCADE",
});

// Relación: Un Movement pertenece a un Report
Movement.belongsTo(Report, {
    foreignKey: "idReport",
    as: "report",
});

// Relación: Un User tiene muchas Notifications
User.hasMany(Notification, {
    foreignKey: "idUser",
    as: "notifications",
});

// Relación: Una Notification pertenece a un User
Notification.belongsTo(User, {
    foreignKey: "idUser",
    as: "user",
});

// Relación: Un User puede tener muchos Files
User.hasMany(File, {
    foreignKey: "idUser",
    as: "files",
});

// Relación: Un File puede pertenecer a un User
File.belongsTo(User, {
    foreignKey: "idUser",
    as: "user",
});

export { User, Report, Transaction, Movement, Notification, File };
