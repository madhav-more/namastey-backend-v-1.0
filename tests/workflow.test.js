// Real HTTP + real Mongoose against a disposable MongoDB. Never loads .env or production data.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
let mongo, server, base, customer, otherCustomer, admin, serviceId, packageId;
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'isolated-workflow-test-secret';
process.env.RATE_LIMIT_MAX = '10000';
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14', downloadDir: require('node:path').resolve(__dirname, '../.qa/mongodb') } });
  await mongoose.connect(mongo.getUri(), { dbName: 'namastey_workflow_tests' });
  const User = require('../src/models/User.model');
  const createUser = async (email, role) => {
    const user = await User.create({ name: 'Test User', email, mobile: '9876543210', password: 'test-only-password', role });
    return { id: user.id, token: jwt.sign({ id: user.id }, process.env.JWT_SECRET) };
  };
  customer = await createUser('customer@example.com', 'customer');
  otherCustomer = await createUser('other@example.com', 'customer');
  admin = await createUser('admin@example.com', 'admin');
  server = require('../app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
async function request(method, path, user, body, expected = 200) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const json = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(json)}`);
  return json.data;
}
function draft(extra = {}) {
  return { requestId: randomUUID(), serviceId, packageId, fromCity: 'Mumbai', fromArea: 'Bandra', toCity: 'Mumbai', toArea: 'Bandra', pickupAddress: 'Test hotel lobby', scheduledDate: new Date(Date.now() + 86400000).toISOString(), scheduledTime: '14:00', customerName: 'Test Guest', customerMobile: '9876543210', customerEmail: 'guest@example.com', addonIds: ['flowers'], ...extra };
}
const create = async extra => (await request('POST', '/bookings', customer, draft(extra), 201)).booking;
async function quote(b, extra = {}) {
  await request('PUT', `/bookings/${b._id}/review`, admin, { decision: 'accepted' });
  return (await request('PUT', `/bookings/${b._id}/quotation`, admin, { price: 1500, providerName: 'Offline Coordinator', providerPhone: '9876543210', notes: 'Welcome agreed by phone.', paymentInstructions: 'Pay offline and share receipt with coordinator.', allowPayLater: true, ...extra })).booking;
}
test('admin creates/edits services and service-linked packages; public catalogue reflects edits', async () => {
  const s = await request('POST', '/admin/catalogue/services', admin, { name: 'Hotel Greeting', kind: 'hotel', description: 'Test service' }, 201);
  serviceId = s.service.id;
  const p = await request('POST', '/admin/catalogue/packages', admin, { name: 'Hotel Classic', price: 800, serviceIds: [serviceId], includes: ['Greeting'] }, 201);
  packageId = p.package.id;
  await request('PUT', `/admin/catalogue/packages/${packageId}`, admin, { name: 'Hotel Classic', price: 900, serviceIds: [serviceId], includes: ['Greeting'] });
  const catalogue = await request('GET', '/data/catalogue');
  assert.ok(catalogue.services.some(s => s.id === serviceId));
  assert.equal(catalogue.packages.find(p => p.id === packageId).price, 900);
  await request('POST', '/admin/catalogue/services', customer, { name: 'Forbidden', kind: 'hotel' }, 403);
  await request('POST', '/admin/catalogue/packages', admin, { name: 'Invalid', price: 1, serviceIds: ['missing'] }, 400);
});
test('requests enforce service/package relation, add-on uniqueness and server pricing', async () => {
  await request('POST', '/bookings', customer, draft({ serviceId: 'airport' }), 400);
  await request('POST', '/bookings', customer, draft({ addonIds: ['flowers', 'flowers'] }), 400);
  await request('POST', '/bookings', customer, draft({ scheduledDate: new Date(Date.now() - 10000).toISOString() }), 400);
  const b = await create({ totalAmount: 1, packagePrice: 1 });
  assert.equal(b.totalAmount, 1199);
  assert.equal(b.status, 'pending'); assert.equal(b.service.id, serviceId);
  await request('GET', `/bookings/${b._id}`, otherCustomer, null, 403);
  await request('PUT', `/bookings/${b._id}/review`, customer, { decision: 'accepted' }, 403);
});
test('duplicate submissions are idempotent, including simultaneous requests', async () => {
  const data = draft();
  const [a, b] = await Promise.all([request('POST', '/bookings', customer, data, 201), request('POST', '/bookings', customer, data, 201)]);
  assert.equal(a.booking._id, b.booking._id);
  await request('POST', '/bookings', customer, { ...data, customerName: 'Changed guest' }, 409);
});
test('review cannot be bypassed; rejection needs a reason and is terminal', async () => {
  const b = await create();
  await request('PUT', `/bookings/${b._id}/quotation`, admin, { price: 1500, providerName: 'Test', providerPhone: '9876543210' }, 409);
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'confirmed' }, 409);
  await request('PUT', `/bookings/${b._id}/review`, admin, { decision: 'rejected' }, 400);
  const r = await request('PUT', `/bookings/${b._id}/review`, admin, { decision: 'rejected', reason: 'Provider unavailable.' });
  assert.equal(r.booking.status, 'rejected');
  await request('PUT', `/bookings/${b._id}/review`, admin, { decision: 'accepted' }, 409);
  await request('PUT', `/bookings/${b._id}/cancel`, customer, {}, 409);
});
test('stale quotations and unauthorized approvals are rejected', async () => {
  const b = await create(); const q = await quote(b);
  const revised = await request('PUT', `/bookings/${b._id}/quotation`, admin, { price: 1600, providerName: 'Coordinator', providerPhone: '9876543210' });
  assert.equal(revised.booking.quotation.version, q.quotation.version + 1);
  await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_later', quoteVersion: q.quotation.version }, 409);
  await request('PUT', `/bookings/${b._id}/accept-quotation`, otherCustomer, { paymentChoice: 'pay_later', quoteVersion: revised.booking.quotation.version }, 403);
  await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, {}, 400);
});
test('Pay Now waits for verified offline payment before staff/service; completion and feedback work', async () => {
  const b = await create(); const q = await quote(b);
  const accept = await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_now', quoteVersion: q.quotation.version });
  assert.equal(accept.booking.status, 'payment_pending'); assert.equal(accept.booking.totalAmount, 1500);
  await request('PUT', `/bookings/${b._id}/assign`, admin, { assignedName: 'Greeter', assignedPhone: '9876543210' }, 409);
  await request('PUT', `/bookings/${b._id}/payment`, customer, { amount: 1500, reference: 'receipt-001' }, 403);
  await request('PUT', `/bookings/${b._id}/payment`, admin, { amount: 1, reference: 'receipt-001' }, 400);
  const paid = await request('PUT', `/bookings/${b._id}/payment`, admin, { amount: 1500, reference: 'receipt-001' });
  assert.equal(paid.booking.status, 'confirmed'); assert.equal(paid.booking.payment.status, 'paid');
  await request('PUT', `/bookings/${b._id}/payment`, admin, { amount: 1500, reference: 'receipt-002' }, 409);
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'in_progress' }, 409);
  await request('PUT', `/bookings/${b._id}/assign`, admin, { assignedName: 'Greeter', assignedPhone: '9876543210' });
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'team_on_the_way' });
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'in_progress' });
  await request('PUT', `/bookings/${b._id}/cancel`, customer, {}, 409);
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'completed' });
  await request('PUT', `/bookings/${b._id}/feedback`, customer, { rating: 5, text: 'Good' });
  await request('PUT', `/bookings/${b._id}/feedback`, customer, { rating: 5 }, 409);
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'pending' }, 409);
});
test('Pay Later permits service while payment stays due, then admin records receipt after completion', async () => {
  const b = await create(); const q = await quote(b);
  const accepted = await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_later', quoteVersion: q.quotation.version });
  assert.equal(accepted.booking.status, 'confirmed'); assert.equal(accepted.booking.payment.status, 'unpaid');
  await request('PUT', `/bookings/${b._id}/assign`, admin, { assignedName: 'Greeter', assignedPhone: '9876543210' });
  await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'in_progress' });
  const finished = await request('PUT', `/bookings/${b._id}/status`, admin, { status: 'completed' });
  assert.equal(finished.booking.payment.status, 'unpaid');
  const paid = await request('PUT', `/bookings/${b._id}/payment`, admin, { amount: 1500, reference: 'cash-record-003' });
  assert.equal(paid.booking.status, 'completed'); assert.equal(paid.booking.payment.status, 'paid');
});
test('quote controls Pay Later availability and cannot be changed after acceptance', async () => {
  const b = await create(); const q = await quote(b, { allowPayLater: false });
  await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_later', quoteVersion: q.quotation.version }, 400);
  await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_now', quoteVersion: q.quotation.version });
  await request('PUT', `/bookings/${b._id}/quotation`, admin, { price: 1700, providerName: 'Test', providerPhone: '9876543210' }, 409);
});
test('paid cancellation records refund pending; verified offline refund is separate', async () => {
  const b = await create(); const q = await quote(b);
  await request('PUT', `/bookings/${b._id}/accept-quotation`, customer, { paymentChoice: 'pay_now', quoteVersion: q.quotation.version });
  await request('PUT', `/bookings/${b._id}/payment`, admin, { amount: 1500, reference: 'receipt-004' });
  const cancelled = await request('PUT', `/bookings/${b._id}/cancel`, customer, { cancelReason: 'Plans changed' });
  assert.equal(cancelled.booking.payment.status, 'refund_pending');
  await request('PUT', `/bookings/${b._id}/refund`, customer, { reference: 'refund-004' }, 403);
  const refund = await request('PUT', `/bookings/${b._id}/refund`, admin, { reference: 'refund-004' });
  assert.equal(refund.booking.payment.status, 'refunded');
  await request('PUT', `/bookings/${b._id}/refund`, admin, { reference: 'refund-005' }, 409);
});
test('concurrent accept/reject cannot overwrite each other or duplicate timeline events', async () => {
  const b = await create();
  const results = await Promise.all(['accepted', 'rejected'].map(decision => fetch(`${base}/bookings/${b._id}/review`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin.token}` }, body: JSON.stringify({ decision, reason: 'Review decision' }) })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const latest = await request('GET', `/bookings/${b._id}`, customer);
  assert.equal(latest.booking.timeline.length, 2);
});
test('disabled catalogue cannot be booked; stored booking snapshots survive package edits', async () => {
  const b = await create();
  await request('PUT', `/admin/catalogue/packages/${packageId}`, admin, { name: 'Changed Package', price: 9999, serviceIds: [serviceId], active: false });
  await request('POST', '/bookings', customer, draft(), 400);
  const latest = await request('GET', `/bookings/${b._id}`, customer);
  assert.equal(latest.booking.package.name, 'Hotel Classic'); assert.equal(latest.booking.packagePrice, 900);
  await request('PUT', `/admin/catalogue/services/${serviceId}`, admin, { name: 'Hotel Greeting', kind: 'hotel', active: false });
  const catalogue = await request('GET', '/data/catalogue');
  assert.ok(!catalogue.services.some(s => s.id === serviceId)); assert.ok(!catalogue.packages.some(p => p.id === packageId));
});
