const Joi = require('joi');

const CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Business',
  'Food', 'Rent', 'Transport', 'Utilities',
  'Healthcare', 'Education', 'Entertainment', 'Other',
];

/**
 * Validation schema for creating a financial record
 */
const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  type: Joi.string().valid('income', 'expense').required().messages({
    'any.only': 'Type must be either income or expense',
    'any.required': 'Transaction type is required',
  }),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
    'any.required': 'Category is required',
  }),
  date: Joi.date().iso().default(() => new Date()),
  notes: Joi.string().max(500).allow('', null),
});

/**
 * Validation schema for updating a financial record (all fields optional)
 */
const updateRecordSchema = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().valid(...CATEGORIES),
  date: Joi.date().iso(),
  notes: Joi.string().max(500).allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation schema for query filters on records
 */
const recordFilterSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  category: Joi.string().valid(...CATEGORIES),
  type: Joi.string().valid('income', 'expense'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100),
});

/**
 * Generic validation runner — returns formatted error array or null
 */
const validate = (schema, data) => {
  const { error } = schema.validate(data, { abortEarly: false });
  if (!error) return null;
  return error.details.map((d) => ({
    field: d.context.key,
    message: d.message.replace(/['"]/g, ''),
  }));
};

module.exports = { createRecordSchema, updateRecordSchema, recordFilterSchema, validate };
