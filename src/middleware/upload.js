import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Puedes configurar la ruta del directorio de uploads
const uploadDir = path.join(__dirname, "../../public/uploads");

// Crear el directorio si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, extension);
        const sanitizedName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const uniqueSuffix = `${Date.now()}`;
        cb(null, `${sanitizedName}-${uniqueSuffix}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Tipo de archivo no permitido"), false);
    }

    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    if (!extname) {
        return cb(new Error("Extensión de archivo no permitida"), false);
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite
        files: 1, // Solo se permite un archivo
    },
    fileFilter,
});

export default upload;
