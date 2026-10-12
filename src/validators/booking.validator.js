const Joi = require('joi');
const { BOOKING_STATUSES } = require('../constants/data');

const createBookingSchema = Joi.object({
  fromCity: Joi.string().trim().required()
    .messages({ 'any.required': 'From city is required' }),
  fromArea: Joi.string().trim().required()
    .messages({ 'any.required': 'From area is required' }),
  pickupAddress: Joi.string().trim().allow('').optional(),
  toCity: Joi.string().trim().required()
    .messages({ 'any.required': 'To city is required' }),
  toArea: Joi.string().trim().required()
    .messages({ 'any.required': 'To area is required' }),
  dropAddress: Joi.string().trim().allow('').optional(),
  serviceId: Joi.string().trim().required(),
  requestId: Joi.string().guid({ version: ['uuidv4'] }).required(),
  scheduledDate: Joi.date().iso().required()
    .messages({
      'date.greater': 'Scheduled date must be in the future',
      'any.required': 'Scheduled date is required',
    }),
  scheduledTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required()
    .messages({ 'any.required': 'Scheduled time is required' }),
  packageId: Joi.string().trim().required()
    .messages({ 'any.required': 'Package is required' }),
  culturalThemeId: Joi.string().trim().allow('').optional(),
  addonIds: Joi.array().items(Joi.string().trim()).unique().max(20).optional().default([]),
  specialInstructions: Joi.string().trim().max(500).allow('').optional(),

  // New Client & Guest Details
  customerName: Joi.string().trim().max(100).required()
    .messages({ 'any.required': 'Name is required' }),
  customerMobile: Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).required()
    .messages({ 'any.required': 'Mobile number is required' }),
  customerEmail: Joi.string().email().trim().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Invalid email format' }),
  companyName: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  flightNumber: Joi.string().trim().allow('').optional(),
  numberOfGuests: Joi.number().integer().min(1).optional().default(1),
  vipRequirements: Joi.string().trim().allow('').optional(),
  supportingDocuments: Joi.array().items(Joi.string().uri({ scheme: ['https'] }).max(2048)).max(10).optional().default([]),
});

const cancelBookingSchema = Joi.object({
  cancelReason: Joi.string().trim().max(500).allow('').optional(),
});

const sendQuotationSchema = Joi.object({
  price: Joi.number().positive().precision(2).required()
    .messages({ 'any.required': 'Quotation price is required', 'number.positive': 'Price must be positive' }),
  notes: Joi.string().trim().max(2000).allow('').default(''),
  providerName: Joi.string().trim().max(100).required(),
  providerPhone: Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).required(),
  paymentInstructions: Joi.string().trim().max(2000).allow('').default(''),
  allowPayLater: Joi.boolean().default(true),
});
const reviewSchema = Joi.object({ decision: Joi.string().valid('accepted', 'rejected').required(), reason: Joi.string().trim().max(1000).allow('').when('decision', { is: 'rejected', then: Joi.string().trim().min(3).required() }) });
const acceptQuotationSchema = Joi.object({ paymentChoice: Joi.string().valid('pay_now', 'pay_later').required(), quoteVersion: Joi.number().integer().min(0).required() });
const paymentSchema = Joi.object({ amount: Joi.number().positive().precision(2).required(), reference: Joi.string().trim().min(3).max(200).required() });
const refundSchema = Joi.object({ reference: Joi.string().trim().min(3).max(200).required() });

const assignOperationsSchema = Joi.object({
  assignedName: Joi.string().trim().max(100).required()
    .messages({ 'any.required': 'Operations staff name is required' }),
  assignedPhone: Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).required()
    .messages({ 'any.required': 'Operations staff phone is required' }),
});

const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Rating is required', 'number.min': 'Rating must be at least 1', 'number.max': 'Rating cannot exceed 5' }),
  text: Joi.string().trim().allow('').optional(),
  suggestions: Joi.string().trim().allow('').optional(),
  issues: Joi.string().trim().allow('').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(BOOKING_STATUSES)).required()
    .messages({ 'any.required': 'Status is required', 'any.only': 'Invalid booking status' }),
  comment: Joi.string().trim().max(1000).allow('').optional(),
});

module.exports = {
  reviewSchema, acceptQuotationSchema, paymentSchema, refundSchema,
  createBookingSchema,
  cancelBookingSchema,
  sendQuotationSchema,
  assignOperationsSchema,
  submitFeedbackSchema,
  updateStatusSchema,
};
