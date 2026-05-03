const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
} = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createBookingSchema, cancelBookingSchema } = require('../validators/booking.validator');

router.post('/', protect, validate(createBookingSchema), createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBookingDetail);
router.put('/:id/cancel', protect, validate(cancelBookingSchema), cancelBooking);

module.exports = router;
