import PDFDocument from "pdfkit";

const createPdf = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Encabezado
        doc.fontSize(18)
            .text("SERVICIOS BURSÁTILES", { align: "center" })
            .moveDown();
        doc.fontSize(12).text(`Ciudad de Yerba Buena`, { align: "center" });
        doc.text(`${data.fechaEmision}`, { align: "center" }).moveDown(2);

        // Título
        doc.fontSize(14)
            .text("Informe de Rentabilidades y Asuntos Conexos", {
                align: "center",
            })
            .moveDown(2);

        // Información del cliente
        doc.fontSize(12).text(`Señor/a: ${data.user.name}`);
        doc.text(`Cliente número: ${data.user.nroCliente}`);
        doc.text(`Tipo: Estado de cuenta`);
        doc.text(`Plan: ${data.plan.periodo}`);
        doc.text(`Moneda: ${data.plan.currency}`);
        doc.text(`Informe N°: ${data.nroReporte}`).moveDown(2);

        // Cuerpo del informe
        doc.text(
            `Estimado/a cliente, nos dirigimos a usted con el fin de informarle su estado de cuenta actual, las rentabilidades generadas hasta la fecha, y con nuestro interés de notificarle que ya puede solicitar su retiro de prestaciones convenidas.`,
            { align: "justify" }
        ).moveDown();

        doc.text(
            `Es de nuestro agrado hacerle saber que en el periodo comprendido entre el ${data.plan.fechaInicio} y el ${data.fechaEmision}, la rentabilidad obtenida sobre su capital fue del ${data.renta}%, totalizando una rentabilidad hasta la fecha del ${data.rentabilidadTotal}%, en base a su plan elegido.`,
            { align: "justify" }
        ).moveDown(2);

        // Tabla de rentabilidad
        doc.fontSize(12).text(
            "Mes      Capital         Renta       Ganancia generada      Extracción",
            { underline: true }
        );
        doc.text(
            `${data.fechaEmision}   $${data.plan.capitalActual}   ${
                data.renta
            }%   $${data.ganancia}   ${data.extraccion || "N/A"}`
        ).moveDown(2);

        // Mensaje final
        doc.text(
            "Sobrepasar altamente las metas que proyectamos, es un orgullo para la empresa, es una realidad también, que el interés compuesto le será de gran ayuda para sobrepasar estos valores.",
            { align: "justify" }
        ).moveDown(2);
        doc.text(
            "Sin nada más que agregar, y colaborando con su satisfacción, por la presente, lo despedimos muy atentamente."
        ).moveDown(3);

        // Firmas
        doc.text("_____________________", 100, doc.y);
        doc.text("Leandro Albornoz Suárez", 100, doc.y);
        doc.text("Presidente y Socio", 100, doc.y).moveDown(2);

        doc.text("_____________________", 300, doc.y);
        doc.text("Tobias Guerineau Nougués", 300, doc.y);
        doc.text("CEO y Socio", 300, doc.y);

        doc.end();
    });
};

export default createPdf;
