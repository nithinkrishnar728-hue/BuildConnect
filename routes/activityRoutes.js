import express from 'express';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect);

// @desc    Get activities for a specific project
// @route   GET /api/activities/project/:projectId
// @access  Private (Client or involved provider)
router.get('/project/:projectId', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const activities = await Activity.find({ projectId })
    .populate('userId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Activity.countDocuments({ projectId });

  res.status(200).json({
    success: true,
    activities,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  });
}));

export default router;
