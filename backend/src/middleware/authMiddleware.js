import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import User from '../models/User.js';
import { sendError } from '../utils/response.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }
  return null;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Authorization token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'User not found' });
    }
    if (user.isBlocked) {
      return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Account is blocked' });
    }

    req.user = user;
    return next();
  } catch (err) {
    const isTokenError = err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError';
    const status = isTokenError ? httpStatus.UNAUTHORIZED : httpStatus.INTERNAL_SERVER_ERROR;
    const message = isTokenError ? 'Token invalid or expired' : 'Authentication failed';
    return sendError(res, { status, message });
  }
};

export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user?.role)) {
    return sendError(res, { status: httpStatus.FORBIDDEN, message: 'Insufficient permissions' });
  }
  return next();
};
