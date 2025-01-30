import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

////////////////////////////////////////////////////////////////

import AuthRoutes from "./routes/auth.routes.js";
import ReportsRoutes from "./routes/reports.routes.js";
import TransactionsRoutes from "./routes/transaction.routes.js";
import UserRoutes from "./routes/user.routes.js";
import SysadminRoutes from "./routes/sysadmin.routes.js";

const app = express();

//////////////MIDDLEWARES//////////////////////////////////////////////////
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: ["http://localhost:3000", "https://app.albornozyguerineau.com"], // Permitir tu frontend
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
        credentials: true, // Si usas cookies o credenciales
    })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

//////////////ROUTES//////////////////////////////////////////////////

app.use(`${process.env.API_VERSION}/auth`, AuthRoutes);
app.use(`${process.env.API_VERSION}/user`, UserRoutes);
app.use(`${process.env.API_VERSION}/user/reports`, ReportsRoutes);
app.use(`${process.env.API_VERSION}/user/transactions`, TransactionsRoutes);
app.use(`${process.env.API_VERSION}/admin`, SysadminRoutes);
export default app;
