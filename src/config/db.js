import pg from "pg";
import { Sequelize } from "sequelize";

const { POSTGRES_URI } = process.env;

const sequelize = new Sequelize(`${POSTGRES_URI}`, {
    dialect: "postgres",
    dialectModule: pg,
    native: false,
    logging: false,
});

export default sequelize;
