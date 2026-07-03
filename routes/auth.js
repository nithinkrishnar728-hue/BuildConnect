import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateAuth } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Signup
router.post('/signup', validateAuth.signup, asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if user exists
  let user = await User.findOne({ email });
  if (user) {
    throw new AppError('User already exists', 400);
  }

  // Create user
  user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    verified: true // Auto-verify for demo
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: user.getPublicProfile()
  });
}));

// Login
router.post('/login', validateAuth.login, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: user.getPublicProfile()
  });
}));

// Get current user
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.status(200).json({
    success: true,
    user: user.getPublicProfile()
  });
}));

export default router;
