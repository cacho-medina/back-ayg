import User from "../models/User.js";
import Report from "../models/Report.js";
import "../models/relations.js";
import { sendReportEmail } from "../helpers/mails/sendEmail.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import calcularRentaTotal from "../utils/calcularRentaTotal.js";

export const getClients = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        // Parámetros de filtrado
        const { search, plan, sort } = req.query;

        // Construir objeto de filtros
        const where = {
            role: "client",
        };

        // Búsqueda por nombre o email
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // Filtro por plan
        if (plan) {
            where.plan = plan;
        }

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_des") {
            order.push(["fechaRegistro", "DESC"]);
        } else if (sort === "date_asc") {
            order.push(["fechaRegistro", "ASC"]);
        }

        // Realizar la consulta con paginación y filtros
        const { count, rows: clients } = await User.findAndCountAll({
            where,
            order,
            limit,
            offset,
            attributes: {
                exclude: ["password"],
            },
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            clients,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los clientes",
            error: error.message,
        });
    }
};

export const getReports = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Parámetros de filtrado
        const { plan, sort, fechaDesde, fechaHasta } = req.query;

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_asc") {
            order.push(["fechaEmision", "ASC"]);
        } else {
            order.push(["fechaEmision", "DESC"]);
        }

        // Construir objeto de filtros para el include de User
        const userWhere = {};
        if (plan) {
            userWhere.plan = plan;
        }

        // Filtro por rango de fechas
        if (fechaDesde || fechaHasta) {
            where.fechaEmision = {};
            if (fechaDesde && fechaHasta) {
                where.fechaEmision = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
                };
            } else if (fechaDesde) {
                where.fechaEmision = { [Op.gte]: new Date(fechaDesde) };
            } else if (fechaHasta) {
                where.fechaEmision = { [Op.lte]: new Date(fechaHasta) };
            }
        }

        // Realizar la consulta con paginación y filtros
        const { count, rows: reports } = await Report.findAndCountAll({
            order,
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "name",
                        "plan",
                        "capitalActual",
                        "fechaRegistro",
                        "currency",
                        "nroCliente",
                    ],
                    where: userWhere,
                },
            ],
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            reports,
            total: count,
            totalPages,
            currentPage: page,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los reportes",
            error: error.message,
        });
    }
};

export const getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "name",
                        "plan",
                        "capitalActual",
                        "currency",
                        "fechaRegistro",
                        "nroCliente",
                    ],
                },
            ],
        });

        if (!report) {
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el reporte" });
    }
};

export const getReportByUserId = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Parámetros de filtrado por fecha
        const { fechaDesde, fechaHasta, sort } = req.query;

        // Construir objeto de filtros
        const where = {
            idUser: req.params.idUser,
        };

        // Configurar ordenamiento
        const order = [];
        if (sort === "date_asc") {
            order.push(["fechaEmision", "ASC"]);
        } else {
            order.push(["fechaEmision", "DESC"]);
        }

        // Filtro por rango de fechas
        if (fechaDesde || fechaHasta) {
            where.fechaEmision = {};
            if (fechaDesde && fechaHasta) {
                where.fechaEmision = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
                };
            } else if (fechaDesde) {
                where.fechaEmision = { [Op.gte]: new Date(fechaDesde) };
            } else if (fechaHasta) {
                where.fechaEmision = { [Op.lte]: new Date(fechaHasta) };
            }
        }

        // Realizar la consulta con paginación y filtros
        const { count, rows: reports } = await Report.findAndCountAll({
            where,
            order,
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "name",
                        "plan",
                        "capitalActual",
                        "fechaRegistro",
                        "currency",
                        "nroCliente",
                    ],
                },
            ],
        });

        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            reports,
            total: count,
            totalPages,
            currentPage: page,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los reportes del usuario",
            error: error.message,
        });
    }
};

export const createReport = async (req, res) => {
    const { idUser, renta, gananciaGenerada, fechaEmision, extraccion } =
        req.body;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(idUser, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        user.capitalActual += gananciaGenerada;

        const report = await Report.create(
            {
                idUser,
                renta,
                gananciaGenerada,
                fechaEmision:
                    fechaEmision || new Date().toISOString().split("T")[0],
                extraccion,
                balance: user.capitalActual,
                rentaTotal: calcularRentaTotal([user.rentaTotal, renta]),
            },
            { transaction: t }
        );

        if (extraccion > 0) {
            user.capitalActual -= extraccion;
            await user.save({ transaction: t });
        }

        await user.save({ transaction: t });

        await t.commit();

        await sendReportEmail(user.email, user.name);

        res.status(201).json({
            message: "Reporte creado exitosamente",
            report,
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al crear el reporte" });
    }
};

export const deleteReport = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const report = await Report.findByPk(req.params.id, { transaction: t });
        if (!report) {
            await t.rollback();
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        const user = await User.findByPk(report.idUser, { transaction: t });
        user.capitalActual -= report.gananciaGenerada;
        if (report.extraccion > 0) {
            user.capitalActual += report.extraccion;
        }

        await user.save({ transaction: t });
        await report.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: "Reporte eliminado exitosamente" });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el reporte" });
    }
};
