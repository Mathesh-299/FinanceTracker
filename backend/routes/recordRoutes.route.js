const express = require('express');
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  getDashboardSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentTransactions,
} = require('../controllers/recordController.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware.middleware');

/**
 * RECORD ROUTES
 * ──────────────
 * RBAC Matrix:
 *  Route                     viewer   analyst   admin
 *  ─────────────────────────────────────────────────
 *  POST   /records            ❌        ❌        ✅
 *  GET    /records            ❌        ✅        ✅
 *  GET    /records/:id        ❌        ✅        ✅
 *  PATCH  /records/:id        ❌        ❌        ✅
 *  DELETE /records/:id        ❌        ❌        ✅
 *  GET    /dashboard/*        ✅        ✅        ✅
 */

// ─── DASHBOARD ROUTES — All authenticated roles ──────────────────────────
// Viewer, Analyst, Admin — summary APIs only for viewers
router.get('/dashboard/summary',    authenticateUser, getDashboardSummary);
router.get('/dashboard/categories', authenticateUser, getCategoryTotals);
router.get('/dashboard/monthly',    authenticateUser, getMonthlyTrends);
router.get('/dashboard/recent',     authenticateUser, getRecentTransactions);

// ─── RECORD CRUD ROUTES ──────────────────────────────────────────────────

// Create — admin only
router.post(
  '/',
  authenticateUser,
  authorizeRoles('admin'),
  createRecord
);

// Read — analyst + admin
router.get(
  '/',
  authenticateUser,
  authorizeRoles('analyst', 'admin'),
  getRecords
);

router.get(
  '/:id',
  authenticateUser,
  authorizeRoles('analyst', 'admin'),
  getRecordById
);

// Update — admin only
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles('admin'),
  updateRecord
);

// Delete (soft) — admin only
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('admin'),
  deleteRecord
);

module.exports = router;
