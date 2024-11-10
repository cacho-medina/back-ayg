import { check } from "express-validator";
import resultValidation from "./resultValidation.js";

const validateUser = [
    check("email")
        .notEmpty()
        .withMessage("email required")
        .matches(/.+\@.+\..+/)
        .withMessage("invalid email"),
    check("password").notEmpty().withMessage("password required"),
    check("role").notEmpty().withMessage("role required"),
    check("name").notEmpty().withMessage("username required"),
    (req, res, next) => resultValidation(req, res, next),
];

export default validateUser;
