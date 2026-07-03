import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JobOffer from '../models/JobOffer.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { workImageUpload } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   POST /api/offers
// @access  Private (Client only)
router.post('/', protect, authorize('client'), asyncHandler(async (req, res) => {
    const { providerId, title, description, category, offeredBudget, duration, message, location, projectId, proposedDate, stageId } = req.body;

    if (!providerId || !title || !description || !category || !offeredBudget || !duration) {
        throw new AppError('Please provide all required fields', 400);
    }

    // Verify provider exists and is a worker/engineer/supervisor
    const provider = await User.findById(providerId);
    if (!provider || provider.role === 'client' || provider.role === 'admin') {
        throw new AppError('Invalid provider', 400);
    }

    // If projectId is provided, verify it exists and belongs to the client
    if (projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new AppError('Project not found', 404);
        }
        if (project.clientId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to add offers to this project', 403);
        }
    }

    // If stageId provided, validate it belongs to the same project
    if (stageId) {
        if (!projectId) throw new AppError('A project must be selected to assign a stage', 400);
        const stage = await Stage.findOne({ _id: stageId, projectId });
        if (!stage) throw new AppError('Stage not found in this project', 400);
    }

    const offer = await JobOffer.create({
        clientId: req.user._id,
        providerId,
        projectId: projectId || null,
        stageId: stageId || null,
        title,
        description,
        category,
        offeredBudget,
        duration,
        message: message || '',
        location: location || '',
        ...(proposedDate && { proposedDate })
    });

    if (offer.projectId) {
        await Activity.create({
            projectId: offer.projectId,
            userId: req.user._id,
            type: 'task_created',
            description: `New direct offer "${offer.title}" was sent`,
            relatedId: offer._id,
            relatedModel: 'JobOffer'
        });
    }

    // Notify the provider
    await Notification.create({
        userId: providerId,
        type: 'job_offer',
        title: 'New Job Offer',
        message: `${req.user.firstName} ${req.user.lastName} sent you a job offer: "${title}"`,
        relatedId: offer._id,
        actionUrl: `/offers/${offer._id}`
    });

    const populated = await JobOffer.findById(offer._id)
        .populate('clientId', 'firstName lastName profileImage rating city')
        .populate('providerId', 'firstName lastName profileImage rating city role')
        .populate('projectId', 'name status _id'); // Added projectId population

    res.status(201).json({
        success: true,
        message: 'Offer sent successfully',
        offer: populated
    });
}));

// ── Get my offers ──
router.get('/my', protect, asyncHandler(async (req, res) => {
    // Offers I sent (as client)
    const sent = await JobOffer.find({ clientId: req.user._id })
        .populate('providerId', 'firstName lastName profileImage rating city role skills specialization qualification')
        .populate('projectId', 'name status _id') // Added projectId population
        .sort({ createdAt: -1 });

    // Offers I received (as provider)
    const received = await JobOffer.find({ providerId: req.user._id })
        .populate('clientId', 'firstName lastName profileImage rating city')
        .populate('projectId', 'name status _id') // Added projectId population
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        sent,
        received
    });
}));

// @route   GET /api/offers/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id)
        .populate('clientId', 'firstName lastName profileImage rating city phone email')
        .populate('providerId', 'firstName lastName profileImage rating city role skills specialization qualification experience hourlyRate')
        .populate('projectId', 'name status _id'); // Added projectId population

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    // Only the client or provider involved can view
    if (offer.clientId._id.toString() !== req.user._id.toString() &&
        offer.providerId._id.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to view this offer', 403);
    }

    res.status(200).json({ success: true, offer });
}));

// ── Accept offer (provider only) ──
router.post('/:id/accept', protect, asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    if (offer.providerId.toString() !== req.user._id.toString()) {
        throw new AppError('Only the provider can accept this offer', 403);
    }

    if (offer.status !== 'pending') {
        throw new AppError(`Offer has already been ${offer.status}`, 400);
    }

    offer.status = 'accepted';
    await offer.save();

    if (offer.projectId) {
        const provider = await User.findById(offer.providerId);
        await Activity.create({
            projectId: offer.projectId,
            userId: req.user._id, // provider
            type: 'provider_hired',
            description: `${provider?.firstName || 'A provider'} accepted the offer "${offer.title}"`,
            relatedId: provider._id,
            relatedModel: 'User'
        });

        await Activity.create({
            projectId: offer.projectId,
            userId: req.user._id,
            type: 'task_status_changed',
            description: `Offer "${offer.title}" is now accepted`,
            relatedId: offer._id,
            relatedModel: 'JobOffer'
        });
    }

    // Notify the client
    await Notification.create({
        userId: offer.clientId,
        type: 'job_offer',
        title: 'Offer Accepted',
        message: `${req.user.firstName} ${req.user.lastName} accepted your job offer: "${offer.title}"`,
        relatedId: offer._id,
        actionUrl: `/offers/${offer._id}`
    });

    res.status(200).json({
        success: true,
        message: 'Offer accepted',
        offer
    });
}));

// ── Decline offer (provider only) ──
router.post('/:id/decline', protect, asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    if (offer.providerId.toString() !== req.user._id.toString()) {
        throw new AppError('Only the provider can decline this offer', 403);
    }

    if (offer.status !== 'pending') {
        throw new AppError(`Offer has already been ${offer.status}`, 400);
    }

    offer.status = 'declined';
    offer.declineReason = req.body.reason || '';
    await offer.save();

    // Notify the client
    await Notification.create({
        userId: offer.clientId,
        type: 'job_offer',
        title: 'Offer Declined',
        message: `${req.user.firstName} ${req.user.lastName} declined your job offer: "${offer.title}"`,
        relatedId: offer._id,
        actionUrl: `/offers/${offer._id}`
    });

    res.status(200).json({
        success: true,
        message: 'Offer declined',
        offer
    });
}));

// ── Complete offer (client only) ──
router.post('/:id/complete', protect, asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    if (offer.clientId.toString() !== req.user._id.toString()) {
        throw new AppError('Only the client who sent this offer can mark it as completed', 403);
    }

    if (offer.status !== 'accepted') {
        throw new AppError('Only accepted offers can be marked as completed', 400);
    }

    offer.status = 'completed';
    offer.completedAt = new Date();
    await offer.save();

    if (offer.projectId) {
        await Activity.create({
            projectId: offer.projectId,
            userId: req.user._id,
            type: 'task_status_changed',
            description: `Offer "${offer.title}" is now completed`,
            relatedId: offer._id,
            relatedModel: 'JobOffer'
        });
    }

    // Notify the provider
    await Notification.create({
        userId: offer.providerId,
        type: 'job_offer',
        title: 'Job Completed',
        message: `${req.user.firstName} ${req.user.lastName} marked the job offer "${offer.title}" as completed`,
        relatedId: offer._id,
        actionUrl: `/offers/${offer._id}`
    });

    const populated = await JobOffer.findById(offer._id)
        .populate('clientId', 'firstName lastName profileImage rating city')
        .populate('providerId', 'firstName lastName profileImage rating city role skills specialization qualification');

    res.status(200).json({
        success: true,
        message: 'Offer marked as completed',
        offer: populated
    });
}));

// ── Upload work image (provider only, accepted offers) ──
router.post('/:id/images', protect, workImageUpload.single('image'), asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    if (offer.providerId.toString() !== req.user._id.toString()) {
        throw new AppError('Only the provider can upload images', 403);
    }

    if (offer.status !== 'accepted') {
        throw new AppError('Can only upload images while the offer is accepted (active)', 400);
    }

    if ((offer.workImages?.length || 0) >= 5) {
        throw new AppError('Maximum 5 images allowed per offer', 400);
    }

    if (!req.file) {
        throw new AppError('No image file provided', 400);
    }

    const imageUrl = `/uploads/work-images/${req.file.filename}`;
    offer.workImages.push(imageUrl);
    await offer.save();

    if (offer.projectId) {
        await Activity.create({
            projectId: offer.projectId,
            userId: req.user._id,
            type: 'image_uploaded',
            description: `New work image uploaded for "${offer.title}"`,
            relatedId: offer._id,
            relatedModel: 'JobOffer'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        workImages: offer.workImages
    });
}));

// ── Delete work image (provider or client) ──
router.delete('/:id/images/:imageIndex', protect, asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    const isProvider = offer.providerId.toString() === req.user._id.toString();
    const isClient = offer.clientId.toString() === req.user._id.toString();

    if (!isProvider && !isClient) {
        throw new AppError('Only the client or provider can delete images', 403);
    }

    if (offer.status !== 'accepted' && offer.status !== 'completed' && offer.status !== 'pending') {
        throw new AppError(`Cannot delete images in ${offer.status} status`, 400);
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= (offer.workImages?.length || 0)) {
        throw new AppError('Invalid image index', 400);
    }

    const imageUrl = offer.workImages[imageIndex];
    // Try to delete file from disk
    try {
        const filePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('Failed to delete image file:', err);
    }

    offer.workImages.splice(imageIndex, 1);
    await offer.save();

    res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        workImages: offer.workImages
    });
}));

// @route   POST /api/job-offers/:id/confirm-date
// @access  Private (Provider only)
router.post('/:id/confirm-date', protect, authorize('worker', 'engineer', 'supervisor'), asyncHandler(async (req, res) => {
    const offer = await JobOffer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Job offer not found', 404);
    }

    // Ensure user is the hired provider
    if (offer.providerId.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to confirm date for this offer', 403);
    }

    // Ensure offer is accepted
    if (offer.status !== 'accepted') {
        throw new AppError('Offer must be accepted to confirm date', 400);
    }

    // Use provided date or fallback to proposedDate
    const dateToConfirm = req.body.date || offer.proposedDate;

    if (!dateToConfirm) {
        throw new AppError('No proposed date to confirm', 400);
    }

    offer.confirmedDate = dateToConfirm;
    await offer.save();

    res.json({
        success: true,
        offer
    });
}));

export default router;
