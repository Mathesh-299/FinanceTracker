const { verifyToken } = require('../utils/jwtUtils');
const { sendError } = require('../utils/responseHelper');
const User = require('../models/User.model');

/**
 * MIDDLEWARE 1: authenticateUser
 * ─────────────────────────────
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches the decoded user payload to req.user for downstream use.
 *
 * Why JWT?
 * JWT is stateless — no DB session lookup needed per request.
 * The token itself carries claims (id, role) signed with a secret,
 * so the server can verify authenticity without storing sessions.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    // Verify token signature and expiry
    const decoded = verifyToken(token);

    // Fetch latest user to check if still active (not deactivated after token issue)
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.isDeleted) {
      return sendError(res, 401, 'User account not found or has been deleted.');
    }

    if (user.status === 'inactive') {
      return sendError(res, 403, 'Your account has been deactivated. Contact admin.');
    }

    req.user = user; // Attach full user to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Authentication failed.');
    }
    return sendError(res, 500, 'Authentication error.');
  }
};

/**
 * MIDDLEWARE 2: authorizeRoles
 * ─────────────────────────────
 * Factory function — returns a middleware that checks if req.user.role
 * is among the allowed roles. Enables clean route-level RBAC like:
 *   router.post('/records', authenticateUser, authorizeRoles('admin'), ...)
 *
 * Why RBAC?
 * Instead of checking permissions ad-hoc in every controller,
 * RBAC enforces access rules at the routing layer — clean, centralized,
 * and easy to audit. Adding a new role requires no controller changes.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access forbidden. Requires one of: [${allowedRoles.join(', ')}]. Your role: ${req.user?.role}`
      );
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
