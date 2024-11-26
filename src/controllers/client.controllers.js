import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";

export const getPortfolio = async (req, res) => {
    // Establece los valores predeterminados para página y límite
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const { count, rows: portfolios } = await Portfolio.findAndCountAll({
            limit,
            offset,
        });
        // Calcula el número total de páginas
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            portfolios,
            currentPage: page,
            totalPages,
            totalPortfolios: count,
        });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Portfolios not found" });
    }
};
export const getPortfolioById = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByPk(req.params.id);
        if (!portfolio) {
            return res
                .status(404)
                .json({ message: "User portfolio not found" });
        }
        res.status(200).json(portfolio);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "User portfolio not found" });
    }
};
