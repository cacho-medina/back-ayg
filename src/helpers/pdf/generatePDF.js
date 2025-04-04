import PDFDocument from "pdfkit-table";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { formatDate } from "../../utils/dateUtils.js";
import formatNumber from "../../utils/formatNumber.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generarPdf = async (report, user, plan) => {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = "./public/temp";
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const doc = new PDFDocument();

            const fileName = `report#${report.nroReporte}-${user.nroCliente}.pdf`;
            const filePath = path.join(tempDir, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Encabezado
            doc.image(
                path.join(__dirname, "../../../public/images/logo-short.png"),
                450,
                50,
                { width: 100 }
            ).moveDown(2);
            doc.text(" ").moveDown(4);
            doc.fontSize(11)
                .text("SERVICIOS BURSÁTILES", { align: "right" })
                .moveDown();
            doc.fontSize(11).text(`Ciudad de Yerba Buena`, { align: "right" });
            doc.text(`${report.fechaEmision}`, { align: "right" }).moveDown(2);

            // Título
            doc.fontSize(16)
                .text("Informe de Rentabilidades y Asuntos Conexos", {
                    align: "center",
                })
                .moveDown(2);

            // Información del cliente
            doc.fontSize(11).text(`Señor/a: ${user.name}`);
            doc.text(`Cliente número: ${user.nroCliente}`);
            doc.text(`Tipo: Estado de cuenta`);
            doc.text(`Plan: ${plan.periodo}`);
            doc.text(`Moneda: ${plan.currency}`);
            doc.text(`Informe N°: ${report.nroReporte}`).moveDown(2);

            // Cuerpo del informe
            doc.fontSize(11)
                .text(
                    `Estimado/a cliente, nos dirigimos a usted con el fin de informarle su estado de cuenta actual, las rentabilidades generadas hasta la fecha, y con nuestro interés de notificarle que ya puede solicitar su retiro de prestaciones convenidas.`,
                    { align: "justify" }
                )
                .moveDown();

            doc.fontSize(11)
                .text(
                    `Es de nuestro agrado hacerle saber que en el periodo comprendido entre el ${formatDate(
                        plan.fechaInicio
                    )} y el ${formatDate(
                        report.fechaEmision
                    )}, la rentabilidad obtenida sobre su capital fue del ${report.renta.toFixed(
                        2
                    )}%, totalizando una rentabilidad hasta la fecha del ${report.rentabilidadTotal.toFixed(
                        2
                    )}%, en base a su plan elegido.`,
                    { align: "justify" }
                )
                .moveDown(2);

            // Tabla de rentabilidad
            const table = {
                headers: [
                    { label: "Mes", property: "mes", width: 100 },
                    { label: "Capital", property: "capital", width: 100 },
                    { label: "Renta", property: "renta", width: 100 },
                    { label: "Ganancia", property: "ganancia", width: 100 },
                    { label: "Extracción", property: "extraccion", width: 100 },
                ],
                datas: [
                    {
                        mes: formatDate(report.fechaEmision),
                        capital: `$${formatNumber(report.montoInicial)}`,
                        renta: `${report.renta.toFixed(2)}%`,
                        ganancia: `$${formatNumber(report.ganancia)}`,
                        extraccion: `$${formatNumber(report.extraccion)}`,
                    },
                ],
            };

            // Usar addTable en lugar de doc.table
            doc.table(table, { width: 400 });

            // Mensaje final
            doc.fontSize(11)
                .text(
                    "Sobrepasar altamente las metas que proyectamos, es un orgullo para la empresa, es una realidad también, que el interés compuesto le será de gran ayuda para sobrepasar estos valores.",
                    { align: "justify" }
                )
                .moveDown(2);
            doc.fontSize(11)
                .text(
                    "Sin nada más que agregar, y colaborando con su satisfacción, por la presente, lo despedimos muy atentamente."
                )
                .moveDown(3);

            // Firmas
            /* doc.text("_____________________", 100, doc.y);
            doc.text("Leandro Albornoz Suárez", 100, doc.y);
            doc.text("Presidente y Socio", 100, doc.y).moveDown(2);

            doc.text("_____________________", 300, doc.y);
            doc.text("Tobias Guerineau Nougués", 300, doc.y);
            doc.text("CEO y Socio", 300, doc.y); */

            doc.end();

            stream.on("finish", () => {
                resolve(filePath); // Este path es el que se pasa al servicio de carga
            });
        } catch (err) {
            reject(err);
        }
    });
};
