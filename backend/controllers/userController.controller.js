const userService = require('../services/userService.service');
const { updateUserSchema, validate } = require('../validations/authValidation.validation');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * USER CONTROLLER
 * ────────────────
 * Admin-only user management endpoints.
 * All routes here are protected by authenticateUser + authorizeRoles('admin').
 */

/**
 * GET /api/users
 * Returns paginated list of all users — admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await userService.getAllUsers({ page, limit });
    return sendSuccess(res, 200, 'Users fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Returns a single user by ID — admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, 200, 'User fetched successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Update user role or status — admin only
 * Cannot update own status to inactive (protected in service layer)
 */
const updateUser = async (req, res, next) => {
  try {
    const errors = validate(updateUserSchema, req.body);
    if (errors) return sendError(res, 400, 'Validation failed', errors);

    const user = await userService.updateUser(req.params.id, req.user._id, req.body);
    return sendSuccess(res, 200, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Soft-delete a user — admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user._id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
