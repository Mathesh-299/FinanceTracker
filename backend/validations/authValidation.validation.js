const Joi = require('joi');

/**
 * Validation schema for user registration
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('viewer', 'analyst', 'admin').default('viewer'),
});

/**
 * Validation schema for user login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Validation schema for updating user role/status (admin action)
 */
const updateUserSchema = Joi.object({
  role: Joi.string().valid('viewer', 'analyst', 'admin'),
  status: Joi.string().valid('active', 'inactive'),
}).min(1).messages({
  'object.min': 'At least one field (role or status) must be provided',
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

module.exports = { registerSchema, loginSchema, updateUserSchema, validate };
