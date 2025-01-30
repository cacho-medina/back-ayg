import User from "./User.js";
import Report from "./Report.js";
import Transaction from "./Transaction.js";

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

export { User, Report, Transaction };
