const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware.
 * @param  {...string} roles — Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    next();
  };
};

module.exports = { authorize };
