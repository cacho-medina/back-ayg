import jwt from "jsonwebtoken";

const generateJwt = async (uid, email) => {
    try {
        const payload = { uid, email };
        const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "8h",
        });
        return token;
    } catch (error) {
        console.error("Error al generar el token:", error.message);
        throw new Error("No se pudo generar el token");
    }
};
export default generateJwt;
