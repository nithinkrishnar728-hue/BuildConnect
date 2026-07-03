import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Create review
router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    toUserId, requestId, rating, title, comment, profileQuality, communication, deliveryTime, isRecommended
  } = req.body;

  if (!toUserId || !requestId) {
    throw new AppError('toUserId and requestId are required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Check if request exists and is completed
  const request = await Request.findById(requestId);
  if (!request || request.status !== 'completed') {
    throw new AppError('Can only review completed requests', 400);
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    fromUserId: req.user._id,
    toUserId,
    requestId
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this user for this request', 400);
  }

  const review = await Review.create({
    fromUserId: req.user._id,
    toUserId,
    requestId,
    rating,
    title,
    comment,
    profileQuality: profileQuality || rating,
    communication: communication || rating,
    deliveryTime: deliveryTime || rating,
    isRecommended
  });

  // Update user rating
  const reviews = await Review.find({ toUserId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await User.findByIdAndUpdate(toUserId, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length
  });

  // Create notification
  await Notification.create({
    userId: toUserId,
    type: 'review',
    title: 'New Review',
    message: `${req.user.firstName} left a ${rating}-star review`,
    relatedId: review._id
  });

  res.status(201).json({
    success: true,
    review
  });
}));

// Get reviews for a user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ toUserId: req.params.userId })
    .populate('fromUserId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 });

  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews,
    averageRating: user.rating
  });
}));

// Get review for specific request
router.get('/request/:requestId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ requestId: req.params.requestId })
    .populate('fromUserId', 'firstName lastName profileImage')
    .populate('toUserId', 'firstName lastName profileImage');

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews
  });
}));

// Update review
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.fromUserId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this review', 403);
  }

  Object.assign(review, req.body);
  await review.save();

  // Recalculate user rating
  const reviews = await Review.find({ toUserId: review.toUserId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await User.findByIdAndUpdate(review.toUserId, {
    rating: Math.round(avgRating * 10) / 10
  });

  res.status(200).json({
    success: true,
    review
  });
}));

// Delete review
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.fromUserId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this review', 403);
  }

  await Review.findByIdAndDelete(req.params.id);

  // Recalculate user rating
  const reviews = await Review.find({ toUserId: review.toUserId });
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  await User.findByIdAndUpdate(review.toUserId, {
    rating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : 0,
    reviewCount: reviews.length
  });

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

export default router;
