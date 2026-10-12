const { createHash } = require('crypto');
const Booking = require('../models/Booking.model');
const ApiError = require('../utils/ApiError');
const catalogue = require('./catalogue.service');
const { CULTURAL_THEMES, ADDONS } = require('../constants/data');
const { terminal, assertServiceReady, assertTransition } = require('../utils/bookingPolicy');
const load = async id => {
  const b = await Booking.findById(id).lean();
  if (!b) throw new ApiError(404, 'Booking not found.');
  return b;
};
const owner = (b, userId) => {
  if (String(b.user?._id || b.user) !== String(userId)) throw new ApiError(403, 'You do not have access to this booking.');
};
// Compare-and-swap: simultaneous review/payment/cancellation must never overwrite each other.
const commit = async (b, fields, comment, actor) => {
  const result = await Booking.findOneAndUpdate({ _id: b._id, __v: b.__v || 0, status: b.status }, {
    $set: fields, $inc: { __v: 1 },
    $push: { timeline: { status: fields.status || b.status, comment, timestamp: new Date(), ...(actor ? { actor } : {}) } },
  }, { new: true, runValidators: true });
  if (!result) throw new ApiError(409, 'This booking changed. Refresh it before trying again.');
  return result;
};
const createBooking = async (userId, data) => {
  const hash = createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(data).sort().map(key => [key, data[key]])))).digest('hex');
  await Booking.init();
  const existing = await Booking.findOne({ user: userId, requestId: data.requestId }).lean();
  const replay = b => {
    if (b.requestHash !== hash) throw new ApiError(409, 'This request ID was already used with different details. Start a new request.');
    return b;
  };
  if (existing) return replay(existing);
  if (!Number.isFinite(new Date(data.scheduledDate).getTime()) || new Date(data.scheduledDate) <= new Date()) throw new ApiError(400, 'Choose a future service date and time.');
  const { service, pkg } = await catalogue.resolveSelection(data.serviceId, data.packageId);
  let theme = { id: '', name: '' };
  if (data.culturalThemeId) {
    const found = CULTURAL_THEMES.find(t => t.id === data.culturalThemeId);
    if (!found) throw new ApiError(400, 'Invalid cultural theme selected.');
    theme = { id: found.id, name: found.name };
  }
  const ids = data.addonIds || [];
  if (new Set(ids).size !== ids.length) throw new ApiError(400, 'An add-on can only be selected once.');
  const addons = ids.map(id => {
    const addon = ADDONS.find(a => a.id === id);
    if (!addon) throw new ApiError(400, 'Invalid add-on selected.');
    return { id: addon.id, name: addon.name, price: addon.price };
  });
  const addonsTotal = Math.round(addons.reduce((sum, a) => sum + a.price, 0) * 100) / 100;
  const { serviceId, packageId, culturalThemeId, addonIds, ...customerData } = data;
  try {
    return await Booking.create({ ...customerData, requestHash: hash, user: userId,
      service: { id: service.id, name: service.name, kind: service.kind },
      package: { id: pkg.id, name: pkg.name, price: pkg.price }, culturalTheme: theme, addons,
      packagePrice: pkg.price, addonsTotal, totalAmount: Math.round((pkg.price + addonsTotal) * 100) / 100,
      status: 'pending', timeline: [{ status: 'pending', comment: 'Service request submitted for admin review.', timestamp: new Date() }],
    });
  } catch (error) {
    if (error.code === 11000) {
      const concurrent = await Booking.findOne({ user: userId, requestId: data.requestId }).lean();
      if (concurrent) return replay(concurrent);
    }
    throw error;
  }
};
const getUserBookings = userId => Booking.find({ user: userId }).sort({ createdAt: -1 }).lean();
const getAdminAllBookings = status => Booking.find(status && status !== 'all' ? { status } : {}).populate('user', 'name email mobile').sort({ createdAt: -1 }).lean();
const getBookingById = async (id, userId, isAdmin = false) => {
  const b = await Booking.findById(id).populate('user', 'name email mobile').lean();
  if (!b) throw new ApiError(404, 'Booking not found.');
  if (!isAdmin) owner(b, userId);
  return b;
};
const reviewBooking = async (id, { decision, reason = '' }, adminId) => {
  const b = await load(id);
  if (!['pending', 'under_review'].includes(b.status)) throw new ApiError(409, 'Only an unreviewed request can be accepted or rejected.');
  if (decision === 'rejected' && reason.trim().length < 3) throw new ApiError(400, 'Enter a reason for rejecting this request.');
  return commit(b, { status: decision, review: { decision, reason, reviewedAt: new Date(), reviewedBy: adminId } }, `Admin ${decision} request.${reason ? ` ${reason}` : ''}`, adminId);
};
const sendQuotation = async (id, data, adminId) => {
  const b = await load(id);
  if (!['accepted', 'quotation_sent'].includes(b.status) || b.quotation?.acceptedAt) throw new ApiError(409, 'Accept the request before sending a quote. An approved quote cannot be changed.');
  const version = (b.quotation?.version || 0) + 1;
  return commit(b, { status: 'quotation_sent', quotation: { ...data, version, sentAt: new Date() } }, `Quotation ${version} sent after offline discussion: INR ${data.price}. ${data.notes || ''}`, adminId);
};
const acceptQuotation = async (id, userId, { paymentChoice, quoteVersion }) => {
  const b = await load(id); owner(b, userId);
  const legacyTerms = ['confirmed', 'quotation_accepted', 'operations_assigned'].includes(b.status) && b.quotation?.acceptedAt && !b.payment?.choice;
  if ((!legacyTerms && b.status !== 'quotation_sent') || !b.quotation?.price) throw new ApiError(409, 'There is no quotation awaiting approval.');
  if (!legacyTerms && new Date(b.scheduledDate) <= new Date()) throw new ApiError(409, 'The service date has passed. Contact the coordinator and submit a new request.');
  if ((b.quotation.version || 0) !== quoteVersion) throw new ApiError(409, 'The quotation has changed. Review the latest amount before accepting.');
  if (paymentChoice === 'pay_later' && b.quotation.allowPayLater === false) throw new ApiError(400, 'Pay Later is not available for this quotation.');
  if (!['pay_now', 'pay_later'].includes(paymentChoice)) throw new ApiError(400, 'Select Pay Now or Pay Later.');
  const status = paymentChoice === 'pay_now' ? 'payment_pending' : legacyTerms && b.status === 'operations_assigned' ? 'operations_assigned' : 'confirmed';
  return commit(b, { status, 'quotation.acceptedAt': new Date(), totalAmount: b.quotation.price,
    payment: { choice: paymentChoice, status: 'unpaid', amount: b.quotation.price },
  }, paymentChoice === 'pay_now' ? 'Quotation approved with Pay Now. Awaiting admin verification of offline payment.' : 'Quotation approved with Pay Later. Payment remains due.');
};
const verifyPayment = async (id, { amount, reference }, adminId) => {
  const b = await load(id);
  if (['rejected', 'cancelled'].includes(b.status) || !b.quotation?.acceptedAt || !b.payment?.choice) throw new ApiError(409, 'An accepted, active quotation is required to record payment.');
  if (b.payment.status === 'paid') throw new ApiError(409, 'Payment has already been verified.');
  if (Math.round(amount * 100) !== Math.round(b.quotation.price * 100)) throw new ApiError(400, 'Received amount must match the accepted quotation.');
  return commit(b, { ...(b.status === 'payment_pending' ? { status: 'confirmed' } : {}),
    'payment.status': 'paid', 'payment.amount': amount, 'payment.reference': reference,
    'payment.paidAt': new Date(), 'payment.verifiedBy': adminId,
  }, `Offline payment verified: INR ${amount}. Reference: ${reference}`, adminId);
};
const updateBookingStatus = async (id, { status, comment = '' }, adminId) => {
  const b = await load(id); assertTransition(b, status);
  return commit(b, { status, ...(status === 'cancelled' ? { cancelReason: comment, cancelledAt: new Date(), ...(b.payment?.status === 'paid' ? { 'payment.status': 'refund_pending' } : {}) } : {}) }, comment || `Status changed to ${status.replace(/_/g, ' ')}.`, adminId);
};
const assignOperationsTeam = async (id, operations, adminId) => {
  const b = await load(id);
  if (!['confirmed', 'operations_assigned'].includes(b.status)) throw new ApiError(409, 'Confirm the booking before assigning or changing greeting staff.');
  assertServiceReady(b);
  return commit(b, { operations, status: 'operations_assigned' }, `Greeting staff assigned: ${operations.assignedName} (${operations.assignedPhone}).`, adminId);
};
const submitFeedback = async (id, userId, feedback) => {
  const b = await load(id); owner(b, userId);
  if (b.status !== 'completed') throw new ApiError(409, 'Feedback is available after service completion.');
  if (b.feedback?.submittedAt) throw new ApiError(409, 'Feedback has already been submitted.');
  return commit(b, { feedback: { ...feedback, submittedAt: new Date() } }, 'Customer submitted feedback.');
};
const cancelBooking = async (id, userId, reason = '') => {
  const b = await load(id); owner(b, userId);
  if (terminal.includes(b.status) || b.status === 'in_progress') throw new ApiError(409, 'This booking can no longer be cancelled in the app. Contact your coordinator.');
  return commit(b, { status: 'cancelled', cancelReason: reason, cancelledAt: new Date(), ...(b.payment?.status === 'paid' ? { 'payment.status': 'refund_pending' } : {}) }, reason || 'Cancelled by customer.');
};
const recordRefund = async (id, { reference }, adminId) => {
  const b = await load(id);
  if (b.status !== 'cancelled' || b.payment?.status !== 'refund_pending') throw new ApiError(409, 'No offline refund is pending for this booking.');
  return commit(b, { 'payment.status': 'refunded', 'payment.refundReference': reference, 'payment.refundedAt': new Date() }, `Offline refund recorded: ${reference}.`, adminId);
};
module.exports = { createBooking, getUserBookings, getAdminAllBookings, getBookingById, reviewBooking, sendQuotation, acceptQuotation, verifyPayment, updateBookingStatus, assignOperationsTeam, submitFeedback, cancelBooking, recordRefund };
