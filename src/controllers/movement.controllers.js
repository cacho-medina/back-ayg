import MovementItem from "../models/MovementItem.js";
import MovementReport from "../models/MovementReport.js";
import fs from "fs";
import ExcelJS from "exceljs";
import { formatDate } from "../utils/dateUtils.js";
import sequelize from "../config/db.js";

export const getMovements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;
        const { count, rows: movements } = await MovementItem.findAndCountAll({
            order: [["time_open", "DESC"]],
            limit,
            offset,
        });
        // Calcular información de paginación
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        res.status(200).json({
            movements,
            total: count,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los movimientos" });
    }
};

export const getMovementById = async (req, res) => {
    try {
        const movement = await MovementItem.findByPk(req.params.id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "No se encontró el movimiento solicitado" });
        }
        return res.status(200).json(movement);
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Error al obtener el movimiento" });
    }
};

export const createMovement = async (req, res) => {
    try {
        const {
            position,
            symbol,
            type,
            volume,
            open_price,
            time_open,
            comission,
            gross_pl,
        } = req.body;

        console.log(req.body);

        const movement = await MovementItem.create({
            position,
            symbol,
            type,
            volume,
            open_price: parseFloat(open_price),
            time_open: time_open,
            comission: parseFloat(comission),
            gross_pl: parseFloat(gross_pl),
        });

        res.status(201).json({
            message: "Movimiento creado exitosamente",
            movement,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el movimiento" });
    }
};

export const uploadMovements = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ message: "No se ha subido ningún archivo" });
        }

        const {
            fechaEmision,
            number_account,
            currency,
            broker,
            rentabilidad_total,
            rentabilidad_personal,
            gastos_operativos,
            beneficio_empresa,
            desgravamen,
            open_frame,
            close_frame,
        } = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.worksheets[0];

        const headers = [];
        worksheet.getRow(1).eachCell((cell) => {
            const headerValue =
                cell.value?.toString().toLowerCase().trim() || "";

            headers.push(headerValue);
        });

        const data = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] =
                        cell.value.toString().trim() === "" ? null : cell.value;
                }
            });

            data.push(rowData);
        });

        if (!data.length) {
            return res.status(400).json({ message: "El excel está vacio" });
        }

        const expectedColumns = [
            "position",
            "symbol",
            "type",
            "volume",
            "open price",
            "time open",
            "commission",
            "gross pl",
        ];

        // Convertimos las columnas del archivo a minúsculas para la comparación
        const columnasArchivo = headers.map((col) => col.toLowerCase().trim());

        // Verificamos las columnas faltantes
        const columnasFaltantes = expectedColumns.filter(
            (col) => !columnasArchivo.includes(col)
        );

        if (columnasFaltantes.length > 0) {
            return res.status(400).json({
                message: `El archivo no contiene las columnas obligatorias: ${columnasFaltantes.join(
                    ", "
                )}`,
            });
        }

        //se parsean los datos
        const movements = data
            .map((row) => {
                const position = row["position"];
                const symbol = row["symbol"];
                const type = row["type"];
                const volume = row["volume"];
                const open_price = row["open price"];
                const time_open = row["time open"];
                const commission = row["commission"];
                const gross_pl = row["gross pl"];
                //se valida que los datos sean correctos

                if (
                    !position ||
                    !symbol ||
                    !type ||
                    !volume ||
                    isNaN(open_price) ||
                    !time_open ||
                    isNaN(commission) ||
                    isNaN(gross_pl)
                ) {
                    return null;
                }

                return {
                    position,
                    symbol,
                    type,
                    volume,
                    open_price,
                    time_open: formatDate(time_open),
                    commission,
                    gross_pl,
                };
            })
            .filter((movement) => movement !== null); //se filtra los movimientos que no son correctos

        if (!movements.length) {
            return res
                .status(400)
                .json({ message: "No hay movimientos válidos para importar" });
        }

        //se eliminan los movimientos importados duplicados
        const movementsSinDuplicar = movements.filter(
            (movement, index, self) =>
                index ===
                self.findIndex((m) => m.position === movement.position)
        );

        //se importan los movimientos

        const movementsCreated = await MovementItem.bulkCreate(
            movementsSinDuplicar.map((movement) => ({
                position: movement.position,
                symbol: movement.symbol,
                type: movement.type,
                volume: movement.volume,
                open_price: movement.open_price,
                time_open: movement.time_open,
                commission: movement.commission,
                gross_pl: movement.gross_pl,
            })),
            {
                validate: true,
                returning: true,
                transaction: t,
            }
        );

        //Crear un reporte y asociar movimientos a el
        const report = await MovementReport.create(
            {
                fechaEmision:
                    fechaEmision || new Date().toISOString().split("T")[0],
                number_account,
                currency,
                broker,
                rentabilidad_total: parseFloat(rentabilidad_total),
                rentabilidad_personal: parseFloat(rentabilidad_personal),
                gastos_operativos: parseFloat(gastos_operativos),
                beneficio_empresa: parseFloat(beneficio_empresa),
                desgravamen: parseFloat(desgravamen),
                open_frame: open_frame,
                close_frame: close_frame,
            },
            { transaction: t }
        );

        await report.addMovementItems(movementsCreated, { transaction: t });

        // Si todo sale bien, confirmamos la transacción
        await t.commit();

        return res.status(201).json({
            message: "Movimientos importados correctamente",
            cantidad: movementsCreated.length,
            report,
        });
    } catch (error) {
        // Si algo falla, revertimos la transacción
        await t.rollback();
        console.error(error);
        res.status(500).json({
            message: "Error al procesar el archivo Excel",
            error: error.message,
        });
    } finally {
        // Limpiar el archivo temporal
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    }
};

export const deleteMovement = async (req, res) => {
    try {
        const movement = await MovementItem.findByPk(req.params.id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "Movimiento no encontrado" });
        }
        await movement.destroy();
        res.status(200).json({ message: "Movimiento eliminado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el movimiento" });
    }
};

export const updateMovement = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            number_account,
            currency,
            broker,
            position,
            symbol,
            type,
            volume,
            open_price,
            time_open,
            comission,
            gross_pl,
        } = req.body;

        const movement = await MovementItem.findByPk(id);
        if (!movement) {
            return res
                .status(404)
                .json({ message: "Movimiento no encontrado" });
        }

        await movement.update(req.body);

        res.status(200).json({
            message: "Movimiento actualizado exitosamente",
            movement,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el movimiento" });
    }
};
