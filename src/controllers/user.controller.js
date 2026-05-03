const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/user.service');

/**
 * @desc    Update profile (name, mobile)
 * @route   PUT /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Profile updated.', { user }));
});

/**
 * @desc    Upload / replace profile photo
 * @route   POST /api/v1/users/profile-photo
 */
const updateProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, 'Please upload an image.'));
  }
  const user = await userService.updateProfilePhoto(req.user._id, req.file.buffer);
  res.status(200).json(new ApiResponse(200, 'Profile photo updated.', { user }));
});

module.exports = { updateProfile, updateProfilePhoto };
