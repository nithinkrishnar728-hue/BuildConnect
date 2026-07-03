import express from 'express';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/jobs/upcoming
// @desc    Get all confirmed jobs (requests and offers) for the logged-in provider
// @access  Private (Provider roles)
router.get('/upcoming', protect, authorize('worker', 'engineer', 'supervisor'), asyncHandler(async (req, res) => {
    // Queries both Request and JobOffer collections for providerId = req.user._id and confirmedDate exists.

    // Requests
    const requests = await Request.find({
        hiredProviderId: req.user._id,
        confirmedDate: { $ne: null }
    }).populate('clientId', 'firstName lastName profileImage');

    // Job Offers
    const offers = await JobOffer.find({
        providerId: req.user._id,
        confirmedDate: { $ne: null }
    }).populate('clientId', 'firstName lastName profileImage');

    // Transform and combine
    const upcomingJobs = [
        ...requests.map(req => ({
            id: req._id,
            title: req.title,
            type: 'request',
            confirmedDate: req.confirmedDate,
            client: req.clientId
        })),
        ...offers.map(offer => ({
            id: offer._id,
            title: offer.title,
            type: 'offer',
            confirmedDate: offer.confirmedDate,
            client: offer.clientId
        }))
    ];

    // Sort by confirmed date ascending
    upcomingJobs.sort((a, b) => new Date(a.confirmedDate) - new Date(b.confirmedDate));

    res.json({
        success: true,
        count: upcomingJobs.length,
        jobs: upcomingJobs
    });
}));

export default router;
