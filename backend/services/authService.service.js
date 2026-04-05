const User = require('../models/User.model');
const { generateToken } = require('../utils/jwtUtils');

/**
 * AUTH SERVICE
 * ─────────────
 * Contains business logic for authentication.
 * Controllers stay thin — they delegate to services.
 */

/**
 * Register a new user.
 * Password hashing is handled automatically by the Mongoose pre-save hook.
 */
const registerUser = async ({ name, email, password, role }) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email, isDeleted: false });
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });

  // Generate JWT — contains userId and role as claims
  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

/**
 * Login user: verify credentials and issue JWT.
 */
const loginUser = async ({ email, password }) => {
  // Must explicitly select password (it's excluded by default via `select: false`)
  const user = await User.findOne({ email, isDeleted: false }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('Account is deactivated. Contact admin.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

module.exports = { registerUser, loginUser };
