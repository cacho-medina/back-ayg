import pg from "pg";
import { Sequelize } from "sequelize";

const { POSTGRES_URI } = process.env;

const sequelize = new Sequelize(`${POSTGRES_URI}`, {
    dialect: "postgres",
    dialectModule: pg,
    native: false,
    logging: false,
    /* pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
    }, */
});

export default sequelize;
