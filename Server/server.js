const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const axios = require('axios');

const app = express();

// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ],
});

// Middleware for logging HTTP requests
app.use((req, res, next) => {
  logger.info(`Request URL: ${req.originalUrl}, Method: ${req.method}`);
  next();
});

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['POST', 'GET'],
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/database')
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  contact: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// User model
const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, username, contact, email, password } = req.body;

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check for existing contact number
    const existingContact = await User.findOne({ contact });
    if (existingContact) {
      return res.status(400).json({ message: 'Contact number already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      firstName,
      lastName,
      username,
      contact,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or email' });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Successful login
    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Piston API URL
// app.post('/run', async (req, res) => {
//   const { code, language } = req.body;
//   const version = LANGUAGE_VERSIONS[language] || ''; // Ensure version is retrieved correctly

//   if (!code) {
//     return res.status(400).json({ output: 'No code provided' });
//   }

//   const requestData = {
//     language: language,
//     version: version,
//     files: [
//       {
//         name: `code.${language}`, // Use a dynamic file name based on the language
//         content: code,
//       },
//     ],
//     stdin: "", // Provide if necessary
//     args: [],  // Provide if necessary
//     compile_timeout: 10000,
//     run_timeout: 3000,
//     compile_memory_limit: -1,
//     run_memory_limit: -1
//   };

//   try {
//     // Use the compileCode function to handle code execution
//     const output = await compileCode(requestData);
//     res.json({ output });
//   } catch (error) {
//     logger.error('Error running code:', error);
//     res.status(500).json({ output: 'Error running the code' });
//   }
// });

// // Function to handle code compilation and execution
// // Function to handle code compilation and execution
// async function compileCode(requestData) {
//   const endpoint = "https://emkc.org/api/v2/piston/execute";

//   try {
//     const response = await axios.post(endpoint, requestData);
//     console.log("Response:", response.data);
//     return response.data;  // Return the full response data
//   } catch (error) {
//     console.error("Error:", error);
//     throw error;  // Throw the error to handle it in the /run route
//   }
// }

// // Export the function
// module.exports = {
//   compileCode
// };




// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
