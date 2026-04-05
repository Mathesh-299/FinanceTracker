const Record = require('../models/Record.model');

/**
 * RECORD SERVICE
 * ───────────────
 * All financial record CRUD + MongoDB aggregation pipelines live here.
 * Controllers call these methods and stay free of business logic.
 */

// ─── CRUD OPERATIONS ──────────────────────────────────────────────────────

/**
 * Create a new financial record.
 */
const createRecord = async (data, userId) => {
  const record = await Record.create({ ...data, createdBy: userId });
  return record.populate('createdBy', 'name email role');
};

/**
 * Get records with filtering, pagination, and search.
 * Accessible by analyst + admin.
 *
 * Filtering supports: date range, category, type, text search in notes.
 */
const getRecords = async ({ startDate, endDate, category, type, page = 1, limit = 10, search }) => {
  const filter = { isDeleted: false };

  // ── Date range filter ──────────────────────────────────────────────────
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // ── Category filter ────────────────────────────────────────────────────
  if (category) filter.category = category;

  // ── Type filter (income / expense) ────────────────────────────────────
  if (type) filter.type = type;

  // ── Text search in notes ───────────────────────────────────────────────
  if (search) filter.notes = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Record.countDocuments(filter);

  const records = await Record.find(filter)
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .skip(skip)
    .limit(Number(limit));

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get single record by ID.
 */
const getRecordById = async (recordId) => {
  const record = await Record.findOne({ _id: recordId, isDeleted: false })
    .populate('createdBy', 'name email');
  if (!record) {
    const error = new Error('Record not found.');
    error.statusCode = 404;
    throw error;
  }
  return record;
};

/**
 * Update a record (admin only).
 */
const updateRecord = async (recordId, updates) => {
  const record = await Record.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  if (!record) {
    const error = new Error('Record not found.');
    error.statusCode = 404;
    throw error;
  }
  return record;
};

/**
 * Soft-delete a record (admin only).
 * Physical deletion is never done — audit trail is preserved.
 */
const deleteRecord = async (recordId) => {
  const record = await Record.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!record) {
    const error = new Error('Record not found.');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Record deleted successfully.' };
};

// ─── AGGREGATION PIPELINES ─────────────────────────────────────────────────

/**
 * DASHBOARD SUMMARY
 * Uses MongoDB aggregation pipeline to compute:
 *  - Total income
 *  - Total expenses
 *  - Net balance
 * A single $group with conditional $sum avoids two separate queries.
 */
const getDashboardSummary = async () => {
  const totals = await Record.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        totalRecords: { $sum: 1 },
      },
    },
  ]);

  const summary = totals[0] || { totalIncome: 0, totalExpenses: 0, totalRecords: 0 };
  summary.netBalance = summary.totalIncome - summary.totalExpenses;

  return summary;
};

/**
 * CATEGORY-WISE TOTALS
 * Groups records by category and sums amounts separately for income and expense.
 * Result used to render pie/bar charts on the frontend dashboard.
 */
const getCategoryTotals = async () => {
  return await Record.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        breakdown: {
          $push: {
            type: '$_id.type',
            total: '$total',
            count: '$count',
          },
        },
        categoryTotal: { $sum: '$total' },
      },
    },
    { $sort: { categoryTotal: -1 } },
  ]);
};

/**
 * MONTHLY TRENDS
 * Groups records by year+month and sums income/expense per month.
 * Uses $dateToString to extract readable month labels.
 * Sorted chronologically for trend line charts.
 */
const getMonthlyTrends = async (year) => {
  const matchStage = { isDeleted: false };
  if (year) {
    matchStage.date = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  return await Record.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        monthLabel: {
          $first: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: { year: '$_id.year', month: '$_id.month' },
              },
            },
          },
        },
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] },
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] },
        },
        totalTransactions: { $sum: '$count' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: '$monthLabel',
        income: 1,
        expense: 1,
        net: { $subtract: ['$income', '$expense'] },
        totalTransactions: 1,
      },
    },
  ]);
};

/**
 * RECENT TRANSACTIONS
 * Returns the N most recent non-deleted records with user info populated.
 */
const getRecentTransactions = async (limit = 10) => {
  return await Record.find({ isDeleted: false })
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .limit(Number(limit));
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
