const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const bookingService = require('../services/booking.service');

/**
 * @desc    Create a new booking
 * @route   POST /api/v1/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Booking created successfully.', { booking }));
});

/**
 * @desc    Get all bookings for authenticated user
 * @route   GET /api/v1/bookings
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Bookings fetched.', { bookings, count: bookings.length }));
});

/**
 * @desc    Get single booking detail
 * @route   GET /api/v1/bookings/:id
 */
const getBookingDetail = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, 'Booking fetched.', { booking }));
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

module.exports = { createBooking, getMyBookings, getBookingDetail, cancelBooking };
