const User = require('../models/User.model');

/**
 * USER SERVICE
 * ─────────────
 * Admin-level operations for managing users.
 */

/**
 * Get all active users (admins only).
 * Supports pagination.
 */
const getAllUsers = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const total = await User.countDocuments({ isDeleted: false });
  const users = await User.find({ isDeleted: false })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single user by ID.
 */
const getUserById = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user role and/or status (admin only).
 * Prevents admin from accidentally deactivating their own account.
 */
const updateUser = async (targetUserId, requestingUserId, updates) => {
  if (String(targetUserId) === String(requestingUserId) && updates.status === 'inactive') {
    const error = new Error('Admins cannot deactivate their own account.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOneAndUpdate(
    { _id: targetUserId, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Soft-delete a user (admin only).
 */
const deleteUser = async (targetUserId, requestingUserId) => {
  if (String(targetUserId) === String(requestingUserId)) {
    const error = new Error('Admins cannot delete their own account.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOneAndUpdate(
    { _id: targetUserId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'User deleted successfully.' };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
