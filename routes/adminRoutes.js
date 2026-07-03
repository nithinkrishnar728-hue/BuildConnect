import express from 'express';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users (public info)
// @route   GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
    const users = await User.find({ role: { $ne: 'admin' } })
        .select('firstName lastName email role city isActive createdAt')
        .sort('-createdAt');
    res.json(users);
}));

// @desc    Suspend user
// @route   PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot suspend another admin', 400);

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User suspended successfully', user });
}));

// @desc    Unsuspend user
// @route   PATCH /api/admin/users/:id/unsuspend
router.patch('/users/:id/unsuspend', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    user.isActive = true;
    await user.save();

    res.json({ success: true, message: 'User unsuspended successfully', user });
}));

// @desc    Get all reports
// @route   GET /api/admin/reports
router.get('/reports', asyncHandler(async (req, res) => {
    const reports = await Report.find()
        .populate('reporter', 'firstName lastName email role')
        .populate('reportedUser', 'firstName lastName email role isActive')
        .sort('-createdAt');
    res.json(reports);
}));

// @desc    Action on report (dismiss or ban)
// @route   PATCH /api/admin/reports/:id/action
router.patch('/reports/:id/action', asyncHandler(async (req, res) => {
    const { status, actionTaken } = req.body;
    const report = await Report.findById(req.params.id).populate('reportedUser');
    if (!report) throw new AppError('Report not found', 404);

    report.status = status;
    report.actionTaken = actionTaken;
    await report.save();

    // If the action is suspend, actually suspend the user
    if (actionTaken === 'suspend' && report.reportedUser) {
        report.reportedUser.isActive = false;
        await report.reportedUser.save();
    }

    res.json({ success: true, message: 'Report updated', report });
}));

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
router.get('/analytics', asyncHandler(async (req, res) => {
    const [clients, providers, projects, requests, offers] = await Promise.all([
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: { $in: ['worker', 'engineer', 'supervisor'] } }),
        Project.countDocuments(),
        Request.countDocuments(),
        JobOffer.countDocuments()
    ]);

    res.json({
        totalUsers: clients + providers,
        clients,
        providers,
        projects,
        requests,
        offers
    });
}));

// @desc    Send announcement
// @route   POST /api/admin/announcements
router.post('/announcements', asyncHandler(async (req, res) => {
    const { title, message, targetRole } = req.body;
    let users = [];
    if (targetRole === 'all') {
        users = await User.find({ role: { $ne: 'admin' }, isActive: true });
    } else {
        users = await User.find({ role: targetRole, isActive: true });
    }

    const notifications = users.map(u => ({
        userId: u._id,
        type: 'system',
        title: `📣 ${title}`,
        message: message,
        read: false
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
    
    res.json({ success: true, message: `Announcement sent to ${notifications.length} users` });
}));

export default router;
