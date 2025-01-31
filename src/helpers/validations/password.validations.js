import { check } from "express-validator";
import resultValidation from "./resultValidation.js";

const validatePasswordReset = [
    check("password")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/\d/)
        .withMessage("La contraseña debe contener al menos un número")
        .matches(/[A-Z]/)
        .withMessage("La contraseña debe contener al menos una mayúscula"),
    check("passwordConfirm").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Las contraseñas no coinciden");
        }
        return true;
    }),
    (req, res, next) => resultValidation(req, res, next),
];

export default validatePasswordReset;
