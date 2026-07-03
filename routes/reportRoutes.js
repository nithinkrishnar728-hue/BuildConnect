import express from 'express';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Submit a report against another user
// @route   POST /api/reports
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
    const { reportedUser, reason, description } = req.body;

    if (!reportedUser || !reason) {
        throw new AppError('Please provide reportedUser and reason', 400);
    }

    if (reportedUser.toString() === req.user._id.toString()) {
        throw new AppError('You cannot report yourself', 400);
    }

    // Check if a pending report already exists from this user for the same reportedUser
    const existingReport = await Report.findOne({
        reporter: req.user._id,
        reportedUser,
        status: 'pending'
    });

    if (existingReport) {
        throw new AppError('You already have a pending report against this user', 400);
    }

    const report = await Report.create({
        reporter: req.user._id,
        reportedUser,
        reason,
        description
    });

    res.status(201).json({
        success: true,
        message: 'Report submitted successfully. Our team will review it shortly.',
        report
    });
}));

export default router;
