import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all notifications for user
router.get('/', protect, asyncHandler(async (req, res) => {
  const { unreadOnly = false, page = 1, limit = 20 } = req.query;

  let filter = { userId: req.user._id };
  if (unreadOnly === 'true') {
    filter.read = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    notifications
  });
}));

// Mark notification as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this notification', 403);
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification
  });
}));

// Mark all as read
router.put('/mark-all/read', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// Delete notification
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this notification', 403);
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
}));

// Delete all notifications
router.delete('/', protect, asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted'
  });
}));

export default router;
