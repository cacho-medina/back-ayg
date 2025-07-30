import app from "./src/app.js";
import sequelize from "./src/config/db.js";
import { DataTypes } from "sequelize";

const PORT = process.env.PORT || 4000;

sequelize
    .sync({ force: false })
    .then(async () => {
        console.log("Connected to PostgresDB");

        // 🧩 ALTER TABLE para agregar "detalle" si no existe
        const table = "Transactions";
        const column = "detalle";

        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable(table);

        if (!tableDescription[column]) {
            console.log(`🛠 Adding column '${column}' to ${table}...`);
            await queryInterface.addColumn(table, column, {
                type: DataTypes.STRING(500),
                allowNull: true,
            });
            console.log(`✅ Column '${column}' added!`);
        } else {
            console.log(`ℹ️ Column '${column}' already exists.`);
        }

        // 🧩 ALTER TABLE para agregar "secondaryEmail" a Users
        const userTable = "Users";
        const userColumn = "secondaryEmail";

        const userTableDescription = await queryInterface.describeTable(
            userTable
        );

        if (!userTableDescription[userColumn]) {
            console.log(`🛠 Adding column '${userColumn}' to ${userTable}...`);
            await queryInterface.addColumn(userTable, userColumn, {
                type: DataTypes.STRING,
                allowNull: true, // o false, según tu necesidad
                validate: {
                    isEmail: true,
                },
            });
            console.log(`✅ Column '${userColumn}' added!`);
        } else {
            console.log(`ℹ️ Column '${userColumn}' already exists.`);
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => console.log("Failed to connect:", err));
