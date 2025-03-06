// app.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const config = require('./config/config');
const databaseRoutes = require('./routes/databaseRoutes');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/user.model'); // Import the User model

const app = express();
app.use(cors());
const Port = config.server.Port;
const DynamiclyIpAdress ="154.0.173.220" 
app.use(bodyParser.json());

// Use the routes
app.use('/api/database', databaseRoutes);

app.use('/api/auth', userRoutes);

// Function to create admin user if not exists
const createAdminUserIfNotExists = async () => {
  try {
    const adminUser = await User.findOne({ where: { email: "admin@gmail.com" } });

    if (!adminUser) {
      // Hash the password before storing it in the database
      const hashedPassword = await bcrypt.hash("admin", 10); // 10 is the saltRounds

      // Create admin user
      const createdAdmin = await User.create({
        email: "admin@gmail.com",
        image: '/images/avatars/1.png',
        name: 'John Doe',
        password: hashedPassword, // You should hash the password in a real-world scenario
        role: "superadmin",
        // permissions: ["updateUser", "deleteUser", "viewUsers"],
      });

      console.log("Admin user created", createdAdmin);
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

// Start the server and create admin user on startup
app.listen(Port,
  DynamiclyIpAdress,
   async () => {
  console.log(`Server running at ${config.mysql.host}:${Port}/`);

  // Ensure admin user is created on server startup
  await createAdminUserIfNotExists();
});
