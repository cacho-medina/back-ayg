import User from "./User.js";
import Report from "./Report.js";
import Portfolio from "./Portfolio.js";

// Relación: Un Portfolio pertenece a un User
Portfolio.belongsTo(User, {
    foreignKey: "userId",
    as: "user", // Alias opcional
});

// Relación: Un User tiene muchos Portfolios
User.hasMany(Portfolio, {
    foreignKey: "userId",
    as: "portfolios", // Alias opcional
});

//Relación: Un Portfolio tiene muchos reportes
Portfolio.hasMany(Report, {
    foreignKey: "idPortfolio",
    as: "reports",
});

Report.belongsTo(Portfolio, {
    foreignKey: "idPortfolio",
    as: "portfolio", // Alias para la relación inversa
});

export { User, Portfolio, Report };
