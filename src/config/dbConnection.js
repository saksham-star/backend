const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: Number(dbConfig.port),
    dialect: dbConfig.dialect,
    logging: false,
    pool: dbConfig.pool
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (error) {
    console.error('DB connection failed');
    console.error(error);
    throw error;
  }
}

module.exports = { sequelize, testConnection };