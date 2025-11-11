const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication middleware to verify JWT token
 * Attaches user object to req.user if token is valid
 */
const auth = asyncHandler(async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError('Access denied. No token provided.');
  }

  const decoded = verifyToken(token);
  
  // Fetch user from database to ensure they still exist
  const user = await User.findById(decoded.id).select('-password');
  
  if (!user) {
    throw new UnauthorizedError('Invalid token. User not found.');
  }

  req.user = user;
  next();
});

module.exports = auth;
