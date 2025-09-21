// app.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const config = require("./config/config");
const databaseRoutes = require("./routes/databaseRoutes");
const userRoutes = require("./routes/userRoutes");
const planRoutes = require("./routes/planRoutes");
const permissionRoutes = require("./routes/permissionRoute");
const dashboardRoutes = require("./routes/dashboaordRoutes");
const User = require("./models/user.model"); // Import the User model
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// const allowedOrigins = [
//   "http://localhost:3000", // Local React app
//   "http://165.73.85.11:2025/",
// ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true); // ✅ Allow request
//       } else {
//         callback(new Error("Not allowed by CORS")); // ❌ Reject request
//       }
//     },
//     credentials: true, // Allow cookies
//     methods: ["GET", "POST", "PUT", "DELETE"], // Allow necessary methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allow headers
//   })
// );

app.set("trust proxy", true);
app.use(cors());

app.use(cookieParser());
app.use(bodyParser.json());

const Port = config.server.Port;
const DynamiclyIpAdress =
  process.env?.APP_ENV === "local" ? "localhost" : process.env.SERVER_IP;

// Use the routes
app.use("/api/database", databaseRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Function to create admin user if not exists
const createAdminUserIfNotExists = async () => {
  try {
    const adminUser = await User.findOne({
      where: { email: "admin@gmail.com" },
    });

    if (!adminUser) {
      // Hash the password before storing it in the database
      const hashedPassword = await bcrypt.hash("admin", 10); // 10 is the saltRounds

      // Create admin user
      const createdAdmin = await User.create({
        email: "admin@gmail.com",
        image: "/images/avatars/1.png",
        name: "John Doe",
        password: hashedPassword, // You should hash the password in a real-world scenario
        role: "superadmin",
        // permissions: ["updateUser", "deleteUser", "viewUsers"],
      });
    } else {
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

// Start the server and create admin user on startup
app.listen(Port, DynamiclyIpAdress, async () => {
  console.log(`Server running at ${DynamiclyIpAdress}:${Port}`);

  // Ensure admin user is created on server startup
  // await createAdminUserIfNotExists();
});
