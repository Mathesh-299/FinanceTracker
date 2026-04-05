const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token.
 * Payload includes userId and role — used in middleware for RBAC.
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify and decode a JWT token.
 * Returns decoded payload or throws if invalid/expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
