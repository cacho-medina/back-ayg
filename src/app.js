import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import UserRoutes from "./routes/user.routes.js";

const app = express();

//////////////MIDDLEWARES//////////////////////////////////////////////////
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

//////////////ROUTES//////////////////////////////////////////////////
app.use("/api/user", UserRoutes);

export default app;
