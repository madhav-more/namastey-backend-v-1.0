const express = require('express');
const router = express.Router();
const { updateProfile, updateProfilePhoto } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateProfileSchema } = require('../validators/auth.validator');
const { upload } = require('../middlewares/upload.middleware');

router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.post('/profile-photo', protect, upload.single('photo'), updateProfilePhoto);

module.exports = router;
