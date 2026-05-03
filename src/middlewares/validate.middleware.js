const ApiError = require('../utils/ApiError');

/**
 * Validate request body against a Joi schema.
 * @param {object} schema — Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      throw new ApiError(400, messages[0], messages);
    }

    req.body = value; // Replace with sanitized values
    next();
  };
};

module.exports = { validate };
