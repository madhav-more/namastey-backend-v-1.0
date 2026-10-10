const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const bookingService = require('../services/booking.service');

/**
 * @desc    Create a new booking / request quote
 * @route   POST /api/v1/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Booking request created successfully.', { booking }));
});

/**
 * @desc    Get all bookings for authenticated customer user
 * @route   GET /api/v1/bookings
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Bookings fetched.', { bookings, count: bookings.length }));
});

/**
 * @desc    Admin: Get all platform bookings
 * @route   GET /api/v1/bookings/admin/all
 */
const getAdminAllBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const bookings = await bookingService.getAdminAllBookings(status);
  res.status(200).json(new ApiResponse(200, 'All platform bookings fetched.', { bookings, count: bookings.length }));
});

/**
 * @desc    Get single booking detail
 * @route   GET /api/v1/bookings/:id
 */
const getBookingDetail = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  const booking = await bookingService.getBookingById(req.params.id, req.user._id, isAdmin);
  res.status(200).json(new ApiResponse(200, 'Booking fetched.', { booking }));
});

/**
 * @desc    Admin: Send Quotation
 * @route   PUT /api/v1/bookings/:id/quotation
 */
const sendQuotation = asyncHandler(async (req, res) => {
  const booking = await bookingService.sendQuotation(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Quotation sent successfully.', { booking }));
});

/**
 * @desc    Customer: Accept Quotation
 * @route   PUT /api/v1/bookings/:id/accept-quotation
 */
const acceptQuotation = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptQuotation(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, 'Quotation accepted.', { booking }));
});

/**
 * @desc    Admin: Update Status Timeline
 * @route   PUT /api/v1/bookings/:id/status
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Booking status updated.', { booking }));
});

/**
 * @desc    Admin: Assign Operations Greeter
 * @route   PUT /api/v1/bookings/:id/assign
 */
const assignOperationsTeam = asyncHandler(async (req, res) => {
  const booking = await bookingService.assignOperationsTeam(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Operations team assigned.', { booking }));
});

/**
 * @desc    Customer: Submit Feedback
 * @route   PUT /api/v1/bookings/:id/feedback
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const booking = await bookingService.submitFeedback(req.params.id, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Feedback submitted successfully.', { booking }));
});

/**
 * @desc    Cancel a booking
 * @route   PUT /api/v1/bookings/:id/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user._id,
    req.body.cancelReason
  );
  res.status(200).json(new ApiResponse(200, 'Booking cancelled.', { booking }));
});

module.exports = {
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
};
