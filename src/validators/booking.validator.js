const Joi = require('joi');

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
  scheduledDate: Joi.date().iso().greater('now').required()
    .messages({
      'date.greater': 'Scheduled date must be in the future',
      'any.required': 'Scheduled date is required',
    }),
  scheduledTime: Joi.string().trim().required()
    .messages({ 'any.required': 'Scheduled time is required' }),
  packageId: Joi.string().trim().required()
    .messages({ 'any.required': 'Package is required' }),
  culturalThemeId: Joi.string().trim().allow('').optional(),
  addonIds: Joi.array().items(Joi.string().trim()).optional().default([]),
  specialInstructions: Joi.string().trim().max(500).allow('').optional(),
});

const cancelBookingSchema = Joi.object({
  cancelReason: Joi.string().trim().max(500).allow('').optional(),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
};
