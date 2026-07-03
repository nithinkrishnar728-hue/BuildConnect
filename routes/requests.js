import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { workImageUpload } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create request
router.post('/', protect, authorize('client'), validateRequest.create, asyncHandler(async (req, res) => {
  const {
    title, description, category, budget, duration, skillsRequired, experienceLevel, projectId, proposedDate, stageId
  } = req.body;

  // If projectId is provided, verify it exists and belongs to the client
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    if (project.clientId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to add requests to this project', 403);
    }
  }

  // If stageId provided, validate it belongs to the same project
  if (stageId) {
    if (!projectId) throw new AppError('A project must be selected to assign a stage', 400);
    const stage = await Stage.findOne({ _id: stageId, projectId });
    if (!stage) throw new AppError('Stage not found in this project', 400);
  }

  const request = await Request.create({
    title,
    description,
    category,
    budget,
    duration,
    skillsRequired: skillsRequired || [],
    experienceLevel,
    clientId: req.user._id,
    projectId: projectId || null,
    stageId: stageId || null,
    ...(proposedDate && { proposedDate })
  });

  if (request.projectId) {
    await Activity.create({
      projectId: request.projectId,
      userId: req.user._id,
      type: 'task_created',
      description: `New public request "${request.title}" was added`,
      relatedId: request._id,
      relatedModel: 'Request'
    });
  }

  res.status(201).json({
    success: true,
    request
  });
}));

// Get all requests with filtering
router.get('/', asyncHandler(async (req, res) => {
  const { category, minBudget, maxBudget, status, search, page = 1, limit = 10 } = req.query;

  let filter = { status: 'open' };

  if (category) filter.category = category;
  if (minBudget) filter.budget = { $gte: parseFloat(minBudget) };
  if (maxBudget) {
    filter.budget = filter.budget || {};
    filter.budget.$lte = parseFloat(maxBudget);
  }
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const requests = await Request.find(filter)
    .populate('clientId', 'firstName lastName profileImage rating')
    .populate('applications.providerId', 'firstName lastName profileImage rating')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Request.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: requests.length,
    total,
    pages: Math.ceil(total / limit),
    requests
  });
}));

// Get single request
router.get('/:id', asyncHandler(async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('clientId', 'firstName lastName profileImage rating bio city')
    .populate('applications.providerId', 'firstName lastName profileImage rating')
    .populate('stageId', 'name order status plannedStartDate plannedEndDate');

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  res.status(200).json({
    success: true,
    request
  });
}));

// Apply for request
router.post('/:id/apply', protect, validateRequest.apply, asyncHandler(async (req, res) => {
  const { proposedPrice, coverLetter } = req.body;

  // Supervisors cannot apply to public requests
  if (req.user.role === 'supervisor') {
    throw new AppError('Supervisors cannot apply to public requests. You can receive direct offers from clients instead.', 403);
  }

  const request = await Request.findById(req.params.id);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  // Check if already applied
  const alreadyApplied = request.applications.some(
    app => app.providerId.toString() === req.user._id.toString()
  );

  if (alreadyApplied) {
    throw new AppError('You have already applied for this request', 400);
  }

  request.applications.push({
    providerId: req.user._id,
    proposedPrice,
    coverLetter,
    status: 'pending'
  });

  await request.save();

  // Create notification for client
  await Notification.create({
    userId: request.clientId,
    type: 'application',
    title: 'New Application',
    message: `${req.user.firstName} has applied for "${request.title}"`,
    relatedId: request._id,
    actionUrl: `/requests/${request._id}`
  });

  res.status(200).json({
    success: true,
    message: 'Application submitted successfully',
    request
  });
}));

// Accept application
router.post('/:requestId/accept-application/:applicationIndex', protect, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.requestId);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.clientId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to perform this action', 403);
  }

  const appIndex = parseInt(req.params.applicationIndex);
  if (!request.applications[appIndex]) {
    throw new AppError('Application not found', 404);
  }

  request.applications[appIndex].status = 'accepted';
  request.hiredProviderId = request.applications[appIndex].providerId;
  request.status = 'in-progress';

  // Reject others
  request.applications.forEach((app, index) => {
    if (index !== appIndex && app.status === 'pending') {
      app.status = 'rejected';
    }
  });

  await request.save();

  if (request.projectId) {
    const provider = await User.findById(request.hiredProviderId);
    await Activity.create({
      projectId: request.projectId,
      userId: request.hiredProviderId,
      type: 'provider_hired',
      description: `${provider?.firstName || 'A provider'} was hired for "${request.title}"`,
      relatedId: request.hiredProviderId,
      relatedModel: 'User'
    });

    await Activity.create({
      projectId: request.projectId,
      userId: req.user._id,
      type: 'task_status_changed',
      description: `Task "${request.title}" is now in-progress`,
      relatedId: request._id,
      relatedModel: 'Request'
    });
  }

  // Notify hired provider
  await Notification.create({
    userId: request.hiredProviderId,
    type: 'request',
    title: 'Application Accepted',
    message: `Your application for "${request.title}" has been accepted`,
    relatedId: request._id,
    actionUrl: `/requests/${request._id}`
  });

  res.status(200).json({
    success: true,
    message: 'Application accepted',
    request
  });
}));

// Complete request
router.post('/:id/complete', protect, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.clientId.toString() !== req.user._id.toString()) {
    throw new AppError('Only the client can complete a request', 403);
  }

  request.status = 'completed';
  request.paymentReleased = true;
  request.completedAt = new Date();
  await request.save();

  if (request.projectId) {
    await Activity.create({
      projectId: request.projectId,
      userId: req.user._id,
      type: 'task_status_changed',
      description: `Task "${request.title}" is now completed`,
      relatedId: request._id,
      relatedModel: 'Request'
    });
  }

  // Create notification
  await Notification.create({
    userId: request.hiredProviderId,
    type: 'payment',
    title: 'Payment Released',
    message: `Payment for "${request.title}" has been released`,
    relatedId: request._id
  });

  res.status(200).json({
    success: true,
    message: 'Request marked as complete',
    request
  });
}));

// Get user's requests
router.get('/my/requests', protect, asyncHandler(async (req, res) => {
  const asClient = await Request.find({ clientId: req.user._id })
    .populate('hiredProviderId', 'firstName lastName')
    .sort({ createdAt: -1 });

  const asProvider = await Request.find({ hiredProviderId: req.user._id })
    .populate('clientId', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    asClient,
    asProvider
  });
}));

// Withdraw / delete request (client only, only if open)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.clientId.toString() !== req.user._id.toString()) {
    throw new AppError('Only the client who created this request can withdraw it', 403);
  }

  if (request.status === 'in-progress') {
    throw new AppError('Cannot withdraw a request that is already in progress', 400);
  }

  await Request.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Request withdrawn successfully'
  });
}));

// ── Upload work image (provider only, in-progress) ──
router.post('/:id/images', protect, workImageUpload.single('image'), asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (!request.hiredProviderId || request.hiredProviderId.toString() !== req.user._id.toString()) {
    throw new AppError('Only the hired provider can upload images', 403);
  }

  if (request.status !== 'in-progress') {
    throw new AppError('Can only upload images while the request is in progress', 400);
  }

  if ((request.workImages?.length || 0) >= 5) {
    throw new AppError('Maximum 5 images allowed per request', 400);
  }

  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const imageUrl = `/uploads/work-images/${req.file.filename}`;
  request.workImages.push(imageUrl);
  await request.save();

  if (request.projectId) {
    await Activity.create({
      projectId: request.projectId,
      userId: req.user._id,
      type: 'image_uploaded',
      description: `New work image uploaded for "${request.title}"`,
      relatedId: request._id,
      relatedModel: 'Request'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    workImages: request.workImages
  });
}));

// ── Delete work image (provider or client) ──
router.delete('/:id/images/:imageIndex', protect, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  const isHiredProvider = request.hiredProviderId && request.hiredProviderId.toString() === req.user._id.toString();
  const isClient = request.clientId.toString() === req.user._id.toString();

  if (!isHiredProvider && !isClient) {
    throw new AppError('Only the client or hired provider can delete images', 403);
  }

  if (request.status !== 'in-progress' && request.status !== 'completed' && request.status !== 'open') {
    throw new AppError(`Cannot delete images in ${request.status} status`, 400);
  }

  const imageIndex = parseInt(req.params.imageIndex);
  if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= (request.workImages?.length || 0)) {
    throw new AppError('Invalid image index', 400);
  }

  const imageUrl = request.workImages[imageIndex];
  // Try to delete file from disk
  try {
    const filePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to delete image file:', err);
  }

  request.workImages.splice(imageIndex, 1);
  await request.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    workImages: request.workImages
  });
}));

// @route   POST /api/requests/:id/confirm-date
// @access  Private (Provider only)
router.post('/:id/confirm-date', protect, authorize('worker', 'engineer', 'supervisor'), asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  // Ensure user is the hired provider
  if (!request.hiredProviderId || request.hiredProviderId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to confirm date for this request', 403);
  }

  // Ensure request is in-progress
  if (request.status !== 'in-progress') {
    throw new AppError('Request must be in-progress to confirm date', 400);
  }

  // Use provided date or fallback to proposedDate
  const dateToConfirm = req.body.date || request.proposedDate;

  if (!dateToConfirm) {
    throw new AppError('No proposed date to confirm', 400);
  }

  request.confirmedDate = dateToConfirm;
  await request.save();

  res.json({
    success: true,
    request
  });
}));

export default router;
