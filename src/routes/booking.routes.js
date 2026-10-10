const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAdminAllBookings,
  getBookingDetail,
  sendQuotation,
  acceptQuotation,
  updateBookingStatus,
  assignOperationsTeam,
  submitFeedback,
  cancelBooking,
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createBookingSchema,
  cancelBookingSchema,
  sendQuotationSchema,
  assignOperationsSchema,
  submitFeedbackSchema,
  updateStatusSchema,
} = require('../validators/booking.validator');

// Customer routes
router.post('/', protect, validate(createBookingSchema), createBooking);
router.get('/', protect, getMyBookings);
router.put('/:id/accept-quotation', protect, acceptQuotation);
router.put('/:id/feedback', protect, validate(submitFeedbackSchema), submitFeedback);
router.put('/:id/cancel', protect, validate(cancelBookingSchema), cancelBooking);

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAdminAllBookings);
router.put('/:id/quotation', protect, authorize('admin', 'super_admin'), validate(sendQuotationSchema), sendQuotation);
router.put('/:id/status', protect, authorize('admin', 'super_admin'), validate(updateStatusSchema), updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin', 'super_admin'), validate(assignOperationsSchema), assignOperationsTeam);

// Shared route (Admin or Owner)
router.get('/:id', protect, getBookingDetail);

module.exports = router;
