const bcrypt = require('bcrypt');
const logger = require('../config/logger');
const { generateToken, getCookieOptions } = require('../utils/tokenUtils');
const { AppError } = require('../middleware/errorHandler');

// Signup controller
const signup = async (req, res, User) => {
  try {
    const { firstName, lastName, username, contact, email, password } = req.body;
    
    // Additional check: ensure username and email don't already exist
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email },
        { contact: contact }
      ]
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (existingUser.contact === contact) {
        return res.status(400).json({ message: 'Contact number already exists' });
      }
    }
    
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ firstName, lastName, username, contact, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

// Login controller
const login = async (req, res, User) => {
  try {
    let { usernameOrEmail, password } = req.body;

    // Additional sanitization: ensure usernameOrEmail is a string, not an object
    if (typeof usernameOrEmail !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    // Sanitize input to prevent NoSQL injection
    const sanitizedInput = usernameOrEmail.trim().toLowerCase();

    // Check if the input is an email or username
    const user = await User.findOne({
      $or: [
        { email: sanitizedInput }, // Check by email
        { username: sanitizedInput } // Check by username
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Compare the hashed password with the input password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      // Generate JWT token
      const token = generateToken(user._id.toString(), user.username);

      // Set token in HTTP-only cookie
      const cookieOptions = getCookieOptions();
      res.cookie('token', token, cookieOptions);
      
      // Debug logging (Remove this in production for security)
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Cookie set for user:', user.username);
        logger.info('Cookie options:', cookieOptions);
      }

      // Return success response with user info (excluding password)
      const responseData = { 
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };

      // Only include token in response for development (security: remove in production)
      if (process.env.NODE_ENV !== 'production') {
        responseData.token = token;
      }

      res.status(200).json(responseData);
    } else {
      res.status(401).json({ message: 'Invalid email/username or password' });
    }
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

// Logout controller
const logout = (req, res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('token', cookieOptions);
  res.status(200).json({ message: 'Logout successful' });
};

// Verify authentication status controller
const verifyAuth = async (req, res, User) => {
  try {
    // If middleware passes, token is valid
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ 
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

module.exports = {
  signup,
  login,
  logout,
  verifyAuth
};

