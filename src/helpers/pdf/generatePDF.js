import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generarPdf = async (report) => {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = "./public/temp";
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const doc = new PDFDocument();

            const fileName = `report#${report.nroReporte}-${report.id}.pdf`;
            const filePath = path.join(tempDir, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Contenido del PDF
            doc.fontSize(20).text(`Reporte: ${report.nroReporte}`, {
                align: "center",
            });
            doc.moveDown();
            doc.fontSize(14).text(`Saldo actual: $${report.montoInicial}`);
            doc.text(`renta: ${report.renta}`);
            doc.text(`Última actualización: ${report.fechaEmision}`);
            // ... más info según tus datos

            doc.end();

            stream.on("finish", () => {
                resolve(filePath); // Este path es el que se pasa al servicio de carga
            });
        } catch (err) {
            reject(err);
        }
    });
};
