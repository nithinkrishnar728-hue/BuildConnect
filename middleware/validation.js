import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    throw new AppError(`Validation errors: ${JSON.stringify(formattedErrors)}`, 400);
  }
  next();
};

export const validateAuth = {
  signup: [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['client', 'engineer', 'worker', 'supervisor']).withMessage('Invalid role'),
    handleValidationErrors
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ]
};

export const validateRequest = {
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('budget').isNumeric().withMessage('Budget must be a number'),
    handleValidationErrors
  ],
  apply: [
    body('proposedPrice').isNumeric().withMessage('Proposed price must be a number'),
    handleValidationErrors
  ]
};
