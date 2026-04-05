const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware.middleware');

/**
 * USER ROUTES
 * ────────────
 * All routes require: authenticateUser + authorizeRoles('admin')
 *
 * RBAC:
 *  viewer  → ❌ no access
 *  analyst → ❌ no access
 *  admin   → ✅ full access
 */

// Apply auth + admin-only access to all user management routes
router.use(authenticateUser, authorizeRoles('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
