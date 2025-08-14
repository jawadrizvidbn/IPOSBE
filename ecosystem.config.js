// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "ipos-be",

      // ✅ CHANGE THIS to your real path:
      cwd: "C:/Users/IPOS/Documents/IPOSBE",

      // Run your app directly with Node
      script: "app.js",
      interpreter: "node",

      // Process behavior
      exec_mode: "fork", // use 'cluster' & increase instances if the app is stateless
      instances: 1,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,

      // Environment (edit as needed by your app)
      env: {
        NODE_ENV: "production",
        // PORT: '4000',
        // APP_ENV: 'production',
        // Any other vars your app reads (dotenv .env is also fine)
      },

      // 👇 Add logs later if you want (first create the folder):
      // out_file: 'C:/Users/IPOS/Documents/IPOSBE/logs/pm2-out.log',
      // error_file: 'C:/Users/IPOS/Documents/IPOSBE/logs/pm2-err.log',
      // merge_logs: true,
      // log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
  ],
};
