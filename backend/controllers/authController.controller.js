const authService = require('../services/authService.service');
const { registerSchema, loginSchema, validate } = require('../validations/authValidation.validation');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * AUTH CONTROLLER
 * ────────────────
 * Thin layer: validates input, calls service, returns response.
 * No business logic lives here.
 */

/**
 * POST /api/auth/register
 * Public route — anyone can register
 */
const register = async (req, res, next) => {
  try {
    // Validate request body using Joi
    console.log(req.body);
    const { name, email, password, role } = req.body;
    const errors = validate(registerSchema, { name, email, password, role });
    console.log(errors);
    if (errors) return sendError(res, 400, 'Validation failed', errors);

    const result = await authService.registerUser({ name, email, password, role });
    return sendSuccess(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
};

/**
 * POST /api/auth/login
 * Public route — returns JWT on success
 */
const login = async (req, res, next) => {
  try {
    const errors = validate(loginSchema, req.body);
    if (errors) return sendError(res, 400, 'Validation failed', errors);

    const result = await authService.loginUser(req.body);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Protected — returns the currently authenticated user's profile
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by authenticateUser middleware
    return sendSuccess(res, 200, 'User profile fetched successfully', { user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
