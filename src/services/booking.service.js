const Booking = require('../models/Booking.model');
const ApiError = require('../utils/ApiError');
const { GREETING_PACKAGES, CULTURAL_THEMES, ADDONS, BOOKING_STATUSES } = require('../constants/data');

/**
 * Create a new booking / request quote.
 */
const createBooking = async (userId, bookingData) => {
  const {
    fromCity, fromArea, pickupAddress,
    toCity, toArea, dropAddress,
    scheduledDate, scheduledTime,
    packageId, culturalThemeId, addonIds,
    specialInstructions,
    customerName, customerMobile, customerEmail, companyName, city,
    flightNumber, numberOfGuests, vipRequirements, supportingDocuments,
  } = bookingData;

  // Resolve package
  const pkg = GREETING_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new ApiError(400, 'Invalid package selected.');
  }

  // Resolve cultural theme (optional)
  let theme = { id: '', name: '' };
  if (culturalThemeId) {
    const found = CULTURAL_THEMES.find((t) => t.id === culturalThemeId);
    if (!found) {
      throw new ApiError(400, 'Invalid cultural theme selected.');
    }
    theme = { id: found.id, name: found.name };
  }

  // Resolve add-ons
  const resolvedAddons = [];
  let addonsTotal = 0;
  if (addonIds && addonIds.length > 0) {
    for (const addonId of addonIds) {
      const addon = ADDONS.find((a) => a.id === addonId);
      if (!addon) {
        throw new ApiError(400, `Invalid add-on: ${addonId}`);
      }
      resolvedAddons.push({ id: addon.id, name: addon.name, price: addon.price });
      addonsTotal += addon.price;
    }
  }

  const totalAmount = pkg.price + addonsTotal;

  const booking = await Booking.create({
    user: userId,
    fromCity, fromArea, pickupAddress: pickupAddress || '',
    toCity, toArea, dropAddress: dropAddress || '',
    scheduledDate, scheduledTime,
    package: { id: pkg.id, name: pkg.name, price: pkg.price },
    culturalTheme: theme,
    addons: resolvedAddons,
    packagePrice: pkg.price,
    addonsTotal,
    totalAmount,
    specialInstructions: specialInstructions || '',
    customerName,
    customerMobile,
    customerEmail,
    companyName: companyName || '',
    city: city || '',
    flightNumber: flightNumber || '',
    numberOfGuests: numberOfGuests || 1,
    vipRequirements: vipRequirements || '',
    supportingDocuments: supportingDocuments || [],
    status: BOOKING_STATUSES.PENDING,
    timeline: [
      {
        status: BOOKING_STATUSES.PENDING,
        comment: 'Booking request submitted successfully.',
        timestamp: new Date(),
      },
    ],
  });

  return booking;
};

/**
 * Get all bookings for a specific customer user.
 */
const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return bookings;
};

/**
 * Admin: Get all bookings across platform.
 */
const getAdminAllBookings = async (filterStatus) => {
  const query = {};
  if (filterStatus && filterStatus !== 'all') {
    query.status = filterStatus;
  }
  const bookings = await Booking.find(query)
    .populate('user', 'name email mobile')
    .sort({ createdAt: -1 })
    .lean();
  return bookings;
};

/**
 * Get a single booking by ID.
 */
const getBookingById = async (bookingMongoId, userId, isAdmin = false) => {
  const booking = await Booking.findById(bookingMongoId).populate('user', 'name email mobile').lean();
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (!isAdmin && booking.user._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this booking.');
  }

  return booking;
};

/**
 * Admin: Send Quotation to Customer.
 */
const sendQuotation = async (bookingMongoId, { price, notes }) => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  booking.quotation = {
    price,
    notes: notes || '',
    sentAt: new Date(),
  };
  booking.status = BOOKING_STATUSES.QUOTATION_SENT;
  booking.timeline.push({
    status: BOOKING_STATUSES.QUOTATION_SENT,
    comment: notes ? `Quotation sent: ₹${price}. Note: ${notes}` : `Quotation prepared & sent: ₹${price}`,
    timestamp: new Date(),
  });

  await booking.save();
  return booking;
};

/**
 * Customer: Accept Quotation.
 */
const acceptQuotation = async (bookingMongoId, userId) => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this booking.');
  }

  if (booking.status !== BOOKING_STATUSES.QUOTATION_SENT) {
    throw new ApiError(400, 'Quotation is not in SENT state.');
  }

  booking.quotation.acceptedAt = new Date();
  booking.status = BOOKING_STATUSES.CONFIRMED;
  booking.timeline.push({
    status: BOOKING_STATUSES.CONFIRMED,
    comment: 'Quotation accepted by customer. Booking confirmed!',
    timestamp: new Date(),
  });

  await booking.save();
  return booking;
};

/**
 * Admin: Update Booking Status & Timeline comment.
 */
const updateBookingStatus = async (bookingMongoId, { status, comment }) => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  booking.status = status;
  booking.timeline.push({
    status,
    comment: comment || `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
    timestamp: new Date(),
  });

  await booking.save();
  return booking;
};

/**
 * Admin: Assign Operations Team Greeter.
 */
const assignOperationsTeam = async (bookingMongoId, { assignedName, assignedPhone }) => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  booking.operations = { assignedName, assignedPhone };
  if (booking.status === BOOKING_STATUSES.CONFIRMED) {
    booking.status = BOOKING_STATUSES.OPERATIONS_ASSIGNED;
  }

  booking.timeline.push({
    status: BOOKING_STATUSES.OPERATIONS_ASSIGNED,
    comment: `Greeter assigned: ${assignedName} (${assignedPhone})`,
    timestamp: new Date(),
  });

  await booking.save();
  return booking;
};

/**
 * Customer: Submit Feedback.
 */
const submitFeedback = async (bookingMongoId, userId, feedbackData) => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this booking.');
  }

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Feedback can only be submitted for completed bookings.');
  }

  booking.feedback = {
    ...feedbackData,
    submittedAt: new Date(),
  };

  await booking.save();
  return booking;
};

/**
 * Cancel a booking.
 */
const cancelBooking = async (bookingMongoId, userId, cancelReason = '') => {
  const booking = await Booking.findById(bookingMongoId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this booking.');
  }

  if (booking.status === BOOKING_STATUSES.CANCELLED) {
    throw new ApiError(400, 'Booking is already cancelled.');
  }

  if (booking.status === BOOKING_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Cannot cancel a completed booking.');
  }

  booking.status = BOOKING_STATUSES.CANCELLED;
  booking.cancelReason = cancelReason;
  booking.cancelledAt = new Date();
  booking.timeline.push({
    status: BOOKING_STATUSES.CANCELLED,
    comment: cancelReason ? `Cancelled: ${cancelReason}` : 'Cancelled by customer.',
    timestamp: new Date(),
  });

  await booking.save();
  return booking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getAdminAllBookings,
  getBookingById,
  sendQuotation,
  acceptQuotation,
  updateBookingStatus,
  assignOperationsTeam,
  submitFeedback,
  cancelBooking,
};
