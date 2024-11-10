import { validationResult } from "express-validator";

const resultValidation = (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ errores: err.array() });
    }
    next();
};

export default resultValidation;
