import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

////////////////////////////////////////////////////////////////
import AdminRoutes from "./routes/admin.routes.js";
import ClientRoutes from "./routes/client.routes.js";
import UserRoutes from "./routes/user.routes.js";

const app = express();

//////////////MIDDLEWARES//////////////////////////////////////////////////
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: ["http://localhost:3000", "https://ayg-app.vercel.app"], // Permitir tu frontend
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
        credentials: true, // Si usas cookies o credenciales
    })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

//////////////ROUTES//////////////////////////////////////////////////

app.use(`${process.env.API_VERSION}/user`, UserRoutes);
app.use(`${process.env.API_VERSION}/admin`, AdminRoutes);
app.use(`${process.env.API_VERSION}/client`, ClientRoutes);

export default app;
