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

// Lista de orígenes permitidos (ajusta según tus dominios)
const allowedOrigins = ["https://ayg-app.vercel.app", "http://localhost:3000"];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

//////////////ROUTES//////////////////////////////////////////////////

app.use(`${process.env.API_VERSION}/user`, UserRoutes);
app.use(`${process.env.API_VERSION}/admin`, AdminRoutes);
app.use(`${process.env.API_VERSION}/client`, ClientRoutes);

export default app;
