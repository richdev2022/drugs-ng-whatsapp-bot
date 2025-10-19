const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both DATABASE_URL (Neon) and individual DB variables
let sequelize;

if (process.env.DATABASE_URL) {
  // Use Neon connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    ssl: true,
    native: false
  });
} else {
  // Fall back to individual DB variables
  sequelize = new Sequelize(
    process.env.DB_NAME || 'drugsng_fallback',
    process.env.DB_USER || 'drugsng_user',
    process.env.DB_PASSWORD || 'your_secure_password',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
