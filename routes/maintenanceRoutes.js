import express from 'express';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// ── Create maintenance request (client only) ──
router.post('/', protect, asyncHandler(async (req, res) => {
    const { originalRequestId, originalOfferId, description, scheduledDate } = req.body;

    if (!description) {
        throw new AppError('Description is required', 400);
    }

    if (!originalRequestId && !originalOfferId) {
        throw new AppError('Either originalRequestId or originalOfferId is required', 400);
    }

    let provider;
    let originalRequest = null;
    let originalOffer = null;

    if (originalRequestId) {
        const request = await Request.findById(originalRequestId);
        if (!request) throw new AppError('Original request not found', 404);
        if (request.clientId.toString() !== req.user._id.toString()) {
            throw new AppError('You are not the client of this request', 403);
        }
        if (request.status !== 'completed') {
            throw new AppError('Can only request maintenance for completed jobs', 400);
        }
        provider = request.hiredProviderId;
        originalRequest = request._id;
    } else {
        const offer = await JobOffer.findById(originalOfferId);
        if (!offer) throw new AppError('Original offer not found', 404);
        if (offer.clientId.toString() !== req.user._id.toString()) {
            throw new AppError('You are not the client of this offer', 403);
        }
        if (offer.status !== 'completed') {
            throw new AppError('Can only request maintenance for completed jobs', 400);
        }
        provider = offer.providerId;
        originalOffer = offer._id;
    }

    const maintenance = await MaintenanceRequest.create({
        client: req.user._id,
        provider,
        originalRequest,
        originalOffer,
        description,
        scheduledDate: scheduledDate || null
    });

    // Notify provider
    await Notification.create({
        userId: provider,
        type: 'maintenance',
        title: 'New Maintenance Request',
        message: `${req.user.firstName} has requested maintenance for a completed job`,
        relatedId: maintenance._id,
        actionUrl: '/my-requests'
    });

    const populated = await MaintenanceRequest.findById(maintenance._id)
        .populate('client', 'firstName lastName profileImage')
        .populate('provider', 'firstName lastName profileImage')
        .populate('originalRequest', 'title')
        .populate('originalOffer', 'title');

    res.status(201).json({
        success: true,
        message: 'Maintenance request created',
        maintenance: populated
    });
}));

// ── Get all maintenance requests for the logged-in user ──
router.get('/', protect, asyncHandler(async (req, res) => {
    const { status } = req.query;

    const filter = {
        $or: [
            { client: req.user._id },
            { provider: req.user._id }
        ]
    };

    if (status) {
        filter.status = status;
    }

    const requests = await MaintenanceRequest.find(filter)
        .populate('client', 'firstName lastName profileImage')
        .populate('provider', 'firstName lastName profileImage')
        .populate('originalRequest', 'title')
        .populate('originalOffer', 'title')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        maintenance: requests
    });
}));

// ── Get single maintenance request ──
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const maintenance = await MaintenanceRequest.findById(req.params.id)
        .populate('client', 'firstName lastName profileImage')
        .populate('provider', 'firstName lastName profileImage')
        .populate('originalRequest', 'title')
        .populate('originalOffer', 'title');

    if (!maintenance) {
        throw new AppError('Maintenance request not found', 404);
    }

    // Only participants can view
    if (
        maintenance.client._id.toString() !== req.user._id.toString() &&
        maintenance.provider._id.toString() !== req.user._id.toString()
    ) {
        throw new AppError('Not authorized to view this maintenance request', 403);
    }

    res.status(200).json({
        success: true,
        maintenance
    });
}));

// ── Update maintenance request status (provider only) ──
router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
    const { status, responseMessage } = req.body;

    const maintenance = await MaintenanceRequest.findById(req.params.id);

    if (!maintenance) {
        throw new AppError('Maintenance request not found', 404);
    }

    if (maintenance.provider.toString() !== req.user._id.toString()) {
        throw new AppError('Only the provider can update the status', 403);
    }

    // Validate transitions
    const allowedTransitions = {
        pending: ['accepted', 'rejected'],
        accepted: ['in-progress'],
        'in-progress': ['completed']
    };

    const allowed = allowedTransitions[maintenance.status];
    if (!allowed || !allowed.includes(status)) {
        throw new AppError(`Cannot transition from '${maintenance.status}' to '${status}'`, 400);
    }

    maintenance.status = status;
    if (responseMessage) {
        maintenance.responseMessage = responseMessage;
    }
    await maintenance.save();

    // Notify client
    const statusLabels = {
        accepted: 'accepted your maintenance request',
        rejected: 'declined your maintenance request',
        'in-progress': 'started work on your maintenance request',
        completed: 'completed your maintenance request'
    };

    await Notification.create({
        userId: maintenance.client,
        type: 'maintenance',
        title: 'Maintenance Update',
        message: `${req.user.firstName} has ${statusLabels[status]}`,
        relatedId: maintenance._id,
        actionUrl: '/my-requests'
    });

    const populated = await MaintenanceRequest.findById(maintenance._id)
        .populate('client', 'firstName lastName profileImage')
        .populate('provider', 'firstName lastName profileImage')
        .populate('originalRequest', 'title')
        .populate('originalOffer', 'title');

    res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        maintenance: populated
    });
}));

export default router;
