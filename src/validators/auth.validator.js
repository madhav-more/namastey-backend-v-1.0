const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required',
    }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required',
    }),
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit Indian mobile number',
      'any.required': 'Mobile number is required',
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required',
    }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit Indian mobile number',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update',
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};
