const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

/**
 * @desc    Register new customer
 * @route   POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, 'Registration successful.', { user, token }));
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, 'Login successful.', { user, token }));
});

/**
 * @desc    Get current authenticated user
 * @route   GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.status(200).json(new ApiResponse(200, 'User fetched.', { user }));
});

module.exports = { register, login, getMe };
