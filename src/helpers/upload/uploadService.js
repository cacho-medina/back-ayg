import cloudinary from "../../config/cloudinary.js";
import fs from "fs";

export const uploadPdfToCloudinary = async (localFilePath, fileName) => {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw", // Para archivos PDF
            public_id: `reports/${fileName}`,
            overwrite: true,
        });

        return result.secure_url;
    } catch (err) {
        throw new Error("Error al subir el PDF a Cloudinary: " + err.message);
    } finally {
        // Asegurar que el archivo temporal se elimine incluso si hay error
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
    }
};
