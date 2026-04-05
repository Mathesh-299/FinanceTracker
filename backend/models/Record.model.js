const mongoose = require('mongoose');

/**
 * Financial Record Schema
 * Tracks income/expense entries with category, date, and creator reference.
 * Compound indexes on date + type + category speed up aggregation queries.
 */
const recordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Salary', 'Freelance', 'Investment', 'Business',   // Income categories
        'Food', 'Rent', 'Transport', 'Utilities',          // Expense categories
        'Healthcare', 'Education', 'Entertainment', 'Other',
      ],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',           // Reference to User model (populate support)
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,        // Soft delete — records are never physically removed
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for aggregation performance ──────────────────────────────────
// Compound index on date+type helps monthly trend and total queries
recordSchema.index({ date: -1, type: 1 });
// Index on category for category-wise aggregation
recordSchema.index({ category: 1 });
// Soft-delete filter index
recordSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Record', recordSchema);
