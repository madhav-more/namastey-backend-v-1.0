const mongoose = require('mongoose');
const { randomBytes } = require('crypto');
const { BOOKING_STATUSES } = require('../constants/data');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: String,
      unique: true,
    },
    service: { id: String, name: String, kind: String },
    review: { decision: String, reason: String, reviewedAt: Date, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
    payment: {
      choice: { type: String, enum: ['pay_now', 'pay_later'] },
      status: { type: String, enum: ['unpaid', 'paid', 'refund_pending', 'refunded'], default: 'unpaid' },
      amount: { type: Number, default: 0, min: 0 },
      reference: String, paidAt: Date, verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      refundReference: String, refundedAt: Date,
    },
    requestId: { type: String },
    requestHash: { type: String },

    // --- Location Details ---
    fromCity: {
      type: String,
      required: [true, 'From city is required'],
    },
    fromArea: {
      type: String,
      required: [true, 'From area is required'],
    },
    pickupAddress: {
      type: String,
      default: '',
    },
    toCity: {
      type: String,
      required: [true, 'To city is required'],
    },
    toArea: {
      type: String,
      required: [true, 'To area is required'],
    },
    dropAddress: {
      type: String,
      default: '',
    },

    // --- Schedule ---
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
    },

    // --- Package & Theme ---
    package: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
    culturalTheme: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
    },

    // --- Add-ons ---
    addons: [
      {
        id: { type: String },
        name: { type: String },
        price: { type: Number },
      },
    ],

    // --- Pricing ---
    packagePrice: {
      type: Number,
      required: true,
    },
    addonsTotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // --- Customer Details ---
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    customerMobile: {
      type: String,
      required: [true, 'Customer mobile number is required'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
    },
    companyName: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },

    // --- Travel Context ---
    flightNumber: {
      type: String,
      default: '',
    },
    numberOfGuests: {
      type: Number,
      default: 1,
    },
    vipRequirements: {
      type: String,
      default: '',
    },
    supportingDocuments: [
      {
        type: String,
      }
    ],

    // --- Quotation ---
    quotation: {
      version: { type: Number, default: 0 },
      providerName: String,
      providerPhone: String,
      paymentInstructions: String,
      allowPayLater: { type: Boolean, default: true },
      price: { type: Number, default: 0 },
      notes: { type: String, default: '' },
      sentAt: { type: Date },
      acceptedAt: { type: Date },
    },

    // --- Operations Team ---
    operations: {
      assignedName: { type: String, default: '' },
      assignedPhone: { type: String, default: '' },
    },

    // --- Feedback ---
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      text: { type: String, default: '' },
      suggestions: { type: String, default: '' },
      issues: { type: String, default: '' },
      submittedAt: { type: Date },
    },

    // --- Timeline History ---
    timeline: [
      {
        status: { type: String, required: true },
        comment: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      }
    ],

    // --- Status ---
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },

    // --- Notes ---
    specialInstructions: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate booking ID before save
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    this.bookingId = `NMS-${randomBytes(8).toString('hex').toUpperCase()}`;
  }
  if (!this.timeline || this.timeline.length === 0) {
    this.timeline = [{
      status: this.status || 'pending',
      comment: 'Booking request submitted successfully.',
      timestamp: new Date()
    }];
  }
  next();
});

// Index for fast user queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ user: 1, requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } });

module.exports = mongoose.model('Booking', bookingSchema);
