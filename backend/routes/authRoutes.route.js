const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController.controller');
const { authenticateUser } = require('../middleware/authMiddleware.middleware');

/**
 * AUTH ROUTES
 * ─────────────
 * Public: POST /register, POST /login
 * Protected: GET /me (requires valid JWT)
 */

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);

module.exports = router;
