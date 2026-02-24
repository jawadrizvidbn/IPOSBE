// config.js

module.exports = {
  mysql: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: "", // Optionally, you can set the database name here
  },
  server: {
    Port: process.env.DB_PORT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};
