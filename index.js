import app from "./src/app.js";
import sequelize from "./src/config/db.js";

const PORT = process.env.PORT || 4004;

sequelize
    .sync({ force: false })
    .then(() => {
        console.log("Connected to PostgresDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => console.log("Failed to connect:", err));
