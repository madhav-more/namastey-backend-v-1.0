const Booking = require('../models/Booking.model');
const ApiError = require('../utils/ApiError');
const { GREETING_PACKAGES, CULTURAL_THEMES, ADDONS, BOOKING_STATUSES } = require('../constants/data');

/**
 * Create a new booking.
 */
const createBooking = async (userId, bookingData) => {
  const {
    fromCity, fromArea, pickupAddress,
    toCity, toArea, dropAddress,
    scheduledDate, scheduledTime,
    packageId, culturalThemeId, addonIds,
    specialInstructions,
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
  });

  return booking;
};

/**
 * Get all bookings for a user.
 */
const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return bookings;
};

/**
 * Get a single booking by ID.
 */
const getBookingById = async (bookingMongoId, userId) => {
  const booking = await Booking.findById(bookingMongoId).lean();
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  // Ensure user owns this booking (unless admin)
  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this booking.');
  }

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
  await booking.save();

  return booking;
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };
