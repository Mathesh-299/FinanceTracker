const recordService = require('../services/recordService.service');
const {
  createRecordSchema,
  updateRecordSchema,
  recordFilterSchema,
  validate,
} = require('../validations/recordValidation.validation');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * RECORD CONTROLLER
 * ──────────────────
 * Handles financial record CRUD and dashboard/analytics endpoints.
 * Business logic is fully delegated to recordService.
 */

// ─── CRUD ──────────────────────────────────────────────────────────────────

/**
 * POST /api/records
 * Create a financial record — admin only
 */
const createRecord = async (req, res, next) => {
  try {
    const errors = validate(createRecordSchema, req.body);
    if (errors) return sendError(res, 400, 'Validation failed', errors);

    const record = await recordService.createRecord(req.body, req.user._id);
    return sendSuccess(res, 201, 'Record created successfully', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/records
 * Get records with optional filters — analyst + admin
 * Supports: startDate, endDate, category, type, page, limit, search
 */
const getRecords = async (req, res, next) => {
  try {
    const errors = validate(recordFilterSchema, req.query);
    if (errors) return sendError(res, 400, 'Invalid filter parameters', errors);

    const result = await recordService.getRecords(req.query);
    return sendSuccess(res, 200, 'Records fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/records/:id
 * Get a single record by ID — analyst + admin
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return sendSuccess(res, 200, 'Record fetched successfully', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/records/:id
 * Update a record — admin only
 */
const updateRecord = async (req, res, next) => {
  try {
    const errors = validate(updateRecordSchema, req.body);
    if (errors) return sendError(res, 400, 'Validation failed', errors);

    const record = await recordService.updateRecord(req.params.id, req.body);
    return sendSuccess(res, 200, 'Record updated successfully', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/records/:id
 * Soft-delete a record — admin only
 */
const deleteRecord = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

// ─── DASHBOARD / ANALYTICS ──────────────────────────────────────────────────

/**
 * GET /api/dashboard/summary
 * Total income, expenses, net balance — ALL roles (viewer, analyst, admin)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await recordService.getDashboardSummary();
    return sendSuccess(res, 200, 'Dashboard summary fetched', { summary });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/categories
 * Category-wise breakdown — ALL roles
 */
const getCategoryTotals = async (req, res, next) => {
  try {
    const categories = await recordService.getCategoryTotals();
    return sendSuccess(res, 200, 'Category totals fetched', { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/monthly?year=2024
 * Monthly income/expense trends — ALL roles
 */
const getMonthlyTrends = async (req, res, next) => {
  try {
    const { year } = req.query;
    const trends = await recordService.getMonthlyTrends(year);
    return sendSuccess(res, 200, 'Monthly trends fetched', { trends });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent?limit=10
 * Most recent transactions — ALL roles
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const transactions = await recordService.getRecentTransactions(limit);
    return sendSuccess(res, 200, 'Recent transactions fetched', { transactions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  getDashboardSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentTransactions,
};
