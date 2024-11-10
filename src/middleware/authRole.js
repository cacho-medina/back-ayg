const authRole = (allowedRoles) => {
    return (req, res, next) => {
        const { role } = req.user; // `req.user` se establece al verificar el token JWT

        if (!allowedRoles.includes(role)) {
            return res
                .status(403)
                .json({ message: "Access denied. Insufficient permissions." });
        }

        next(); // Si el rol coincide, continúa hacia el controlador
    };
};

export default authRole;
