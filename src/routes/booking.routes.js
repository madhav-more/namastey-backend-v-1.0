const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const service = require('../services/booking.service');
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
  reviewSchema, acceptQuotationSchema, paymentSchema, refundSchema,
} = require('../validators/booking.validator');

// Customer routes
router.post('/', protect, validate(createBookingSchema), createBooking);
router.get('/', protect, getMyBookings);
router.get('/request-id', protect, (_req, res) => res.json(new ApiResponse(200, 'Request ID issued.', { requestId: require('crypto').randomUUID() })));
router.put('/:id/accept-quotation', protect, validate(acceptQuotationSchema), acceptQuotation);
router.put('/:id/feedback', protect, validate(submitFeedbackSchema), submitFeedback);
router.put('/:id/cancel', protect, validate(cancelBookingSchema), cancelBooking);

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAdminAllBookings);
router.put('/:id/quotation', protect, authorize('admin', 'super_admin'), validate(sendQuotationSchema), sendQuotation);
router.put('/:id/status', protect, authorize('admin', 'super_admin'), validate(updateStatusSchema), updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin', 'super_admin'), validate(assignOperationsSchema), assignOperationsTeam);
for (const [path, schema, action] of [
  ['review', reviewSchema, service.reviewBooking],
  ['payment', paymentSchema, service.verifyPayment],
  ['refund', refundSchema, service.recordRefund],
]) router.put(`/:id/${path}`, protect, authorize('admin', 'super_admin'), validate(schema), asyncHandler(async (req, res) => {
  const booking = await action(req.params.id, req.body, req.user._id);
  res.json(new ApiResponse(200, 'Booking updated.', { booking }));
}));

// Shared route (Admin or Owner)
router.get('/:id', protect, getBookingDetail);

module.exports = router;
