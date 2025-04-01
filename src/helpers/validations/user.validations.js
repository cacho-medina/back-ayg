import { check } from "express-validator";
import resultValidation from "./resultValidation.js";

const validateUser = [
    check("email")
        .notEmpty()
        .withMessage("email required")
        .matches(/.+\@.+\..+/)
        .withMessage("invalid email"),
    check("password").notEmpty().withMessage("password required"),
    check("name").notEmpty().withMessage("Name required"),
    check("nroCliente").notEmpty().withMessage("Nro de cliente required"),
    check("phone").notEmpty().withMessage("Phone required"),
    check("cumpleaños").notEmpty().withMessage("Birthday required"),
    (req, res, next) => resultValidation(req, res, next),
];

export default validateUser;
