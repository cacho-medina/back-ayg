import { check } from "express-validator";
import resultValidation from "./resultValidation.js";

const validatePlanInfo = [
    check("capitalInicial")
        .notEmpty()
        .withMessage("Capital inicial required")
        .isNumeric()
        .withMessage("Capital inicial must be a number"),
    check("plan").notEmpty().withMessage("Plan required"),
    check("currency").notEmpty().withMessage("Currency required"),
    (req, res, next) => resultValidation(req, res, next),
];

export default validatePlanInfo;
