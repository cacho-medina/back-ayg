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
    check("capitalInicial").notEmpty().withMessage("Capital inicial required"),
    (req, res, next) => resultValidation(req, res, next),
];

export default validateUser;
