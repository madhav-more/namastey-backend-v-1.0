const ApiError = require('./ApiError');
const terminal = ['rejected', 'completed', 'cancelled'];
const transitions = {
  pending: ['under_review', 'cancelled'], under_review: ['cancelled'],
  accepted: ['cancelled'], quotation_sent: ['cancelled'], payment_pending: ['cancelled'],
  quotation_accepted: ['cancelled'], confirmed: ['cancelled'],
  operations_assigned: ['team_on_the_way', 'in_progress', 'cancelled'],
  team_on_the_way: ['in_progress', 'cancelled'], in_progress: ['completed'],
};
function assertServiceReady(booking) {
  if (!booking.quotation?.acceptedAt || !booking.payment?.choice) throw new ApiError(409, 'The customer must accept a quotation and choose payment terms first.');
  if (booking.payment.choice === 'pay_now' && booking.payment.status !== 'paid') throw new ApiError(409, 'Verify the offline Pay Now payment before starting the service.');
}
function assertTransition(booking, next) {
  if (!(transitions[booking.status] || []).includes(next)) throw new ApiError(409, `Cannot change ${booking.status} to ${next}. Use the review, quotation, payment or assignment action.`);
  if (['team_on_the_way', 'in_progress', 'completed'].includes(next)) {
    assertServiceReady(booking);
    if (!booking.operations?.assignedName || !booking.operations?.assignedPhone) throw new ApiError(409, 'Assign the greeting staff first.');
  }
}
module.exports = { terminal, assertServiceReady, assertTransition };
