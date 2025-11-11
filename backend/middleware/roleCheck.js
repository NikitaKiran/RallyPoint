const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware to check if user has required role(s)
 * Must be used after auth middleware
 * @param  {...String} roles - Allowed roles (e.g., 'organiser', 'player')
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
    }

    next();
  };
};

module.exports = roleCheck;
