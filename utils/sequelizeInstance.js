// sequelizeInstance.js

const { Sequelize } = require("sequelize");
const config = require("../config/config"); // Ensure this path is correct

const createSequelizeInstance = (databaseName) => {
  const sequelize = new Sequelize(
    databaseName,
    config.mysql.username,
    config.mysql.password,
    {
      host: config.mysql.host,
      port: Number(config.mysql.port || 3306),
      dialect: "mysql",
      logging: false,

      // IMPORTANT: keep idle shorter than MySQL's wait_timeout (see notes below).
      pool: {
        max: 10, // start sane; raise if you truly need concurrency
        min: 0,
        acquire: 20000, // fail fast if the pool can’t get a connection
        idle: 90000, // 90s; keep this LOWER than MySQL wait_timeout
        evict: 1000, // run eviction every 1s so stale conns get cleaned up
      },

      dialectOptions: {
        connectTimeout: 20000, // 20s
        enableKeepAlive: true, // let the kernel send TCP keepalives
        keepAliveInitialDelay: 10000,
        // If your DB requires TLS (common on managed DBs), uncomment and supply CA if needed:
        // ssl: { rejectUnauthorized: true }
        supportBigNumbers: true,
        bigNumberStrings: true,
      },

      retry: {
        max: 3,
        match: [
          /ECONNRESET/i,
          /ETIMEDOUT/i,
          /SequelizeConnection(Error|RefusedError|AcquireTimeoutError|TimedOutError|HostNotFoundError|HostNotReachableError)/,
        ],
      },
    }
  );

  return sequelize;
};

module.exports = createSequelizeInstance;
