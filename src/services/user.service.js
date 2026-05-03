const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middlewares/upload.middleware');

/**
 * Update user profile (name, mobile).
 */
const updateProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};

/**
 * Upload / replace profile photo.
 */
const updateProfilePhoto = async (userId, fileBuffer) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Delete old photo if exists
  if (user.profilePhoto?.publicId) {
    await deleteFromCloudinary(user.profilePhoto.publicId);
  }

  // Upload new
  const { url, publicId } = await uploadToCloudinary(fileBuffer, 'namastey/profiles');

  user.profilePhoto = { url, publicId };
  await user.save();

  return user;
};

module.exports = { updateProfile, updateProfilePhoto };
