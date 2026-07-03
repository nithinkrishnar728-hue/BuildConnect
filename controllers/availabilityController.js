import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Helper: Normalize date to midnight UTC for reliable comparison
const normalizeDate = (dateString) => {
    const d = new Date(dateString);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @desc    Get current user's availability schedule
// @route   GET /api/availability/me
// @access  Private
export const getMyAvailability = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    let schedule = user.availabilitySchedule || [];

    // Optional date range filtering
    if (req.query.start && req.query.end) {
        const start = normalizeDate(req.query.start);
        const end = normalizeDate(req.query.end);
        schedule = schedule.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });
    }

    res.json({
        availabilityStatus: user.availabilityStatus,
        recurringUnavailable: user.recurringUnavailable || [],
        availabilitySchedule: schedule
    });
});

// @desc    Bulk update availability schedule
// @route   PUT /api/availability/me
// @access  Private
export const updateMyAvailability = asyncHandler(async (req, res) => {
    // Expects an array of { date, status, note }
    const updates = req.body.schedule;
    if (!Array.isArray(updates)) {
        throw new AppError('Schedule updates must be an array', 400);
    }

    const user = await User.findById(req.user._id);

    // Normalize incoming updates
    const updateMap = new Map();
    updates.forEach(u => {
        if (u.date) {
            const normalized = normalizeDate(u.date).toISOString();
            updateMap.set(normalized, {
                date: normalizeDate(u.date),
                status: u.status,
                note: u.note
            });
        }
    });

    // Remove or replace existing entries
    let newSchedule = (user.availabilitySchedule || []).filter(entry => {
        const entryDateIso = new Date(entry.date).toISOString();
        if (updateMap.has(entryDateIso)) {
            return false; // We will push the updated one below
        }
        return true;
    });

    // Add updated entries
    updateMap.forEach(entry => {
        if (entry.status) { // Only add if a status is provided (removes if null/empty)
            newSchedule.push(entry);
        }
    });

    user.availabilitySchedule = newSchedule;

    // Allow updating global status too
    if (req.body.availabilityStatus) {
        user.availabilityStatus = req.body.availabilityStatus;
    }

    await user.save();

    res.json({
        availabilityStatus: user.availabilityStatus,
        availabilitySchedule: user.availabilitySchedule
    });
});

// @desc    Update a single day's status
// @route   PATCH /api/availability/me
// @access  Private
export const updateSingleDayAvailability = asyncHandler(async (req, res) => {
    const { date, status, note } = req.body;
    if (!date) throw new AppError('Date is required', 400);

    const user = await User.findById(req.user._id);
    const normalizedTarget = normalizeDate(date).toISOString();

    let newSchedule = (user.availabilitySchedule || []).filter(entry => {
        return new Date(entry.date).toISOString() !== normalizedTarget;
    });

    if (status) {
        newSchedule.push({
            date: normalizeDate(date),
            status,
            note
        });
    }

    user.availabilitySchedule = newSchedule;
    await user.save();

    res.json({ availabilitySchedule: user.availabilitySchedule });
});

// @desc    Get a specific provider's schedule (for clients booking)
// @route   GET /api/availability/:userId
// @access  Private
export const getProviderAvailability = asyncHandler(async (req, res) => {
    // Any authenticated user can check availability for finding a provider
    const user = await User.findById(req.params.userId);
    if (!user) throw new AppError('Provider not found', 404);

    let schedule = user.availabilitySchedule || [];

    if (req.query.start && req.query.end) {
        const start = normalizeDate(req.query.start);
        const end = normalizeDate(req.query.end);
        schedule = schedule.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });
    }

    res.json({
        availabilityStatus: user.availabilityStatus,
        recurringUnavailable: user.recurringUnavailable || [],
        availabilitySchedule: schedule
    });
});
