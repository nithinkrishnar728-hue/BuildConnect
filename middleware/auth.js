import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      throw new AppError('User not found', 404);
    }
    
    if (req.user.isActive === false) {
      throw new AppError('Your account has been suspended by the platform administrator.', 401);
    }
    
    next();
  } catch (error) {
    throw new AppError('Not authorized to access this route', 401);
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(`User role '${req.user.role}' is not authorized to access this route`, 403);
    }
    next();
  };
};
