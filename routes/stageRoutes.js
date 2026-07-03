import express from 'express';
import mongoose from 'mongoose';
import Stage from '../models/Stage.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Helper: verify user can manage stages for a given project
const canManageProject = (project, userId, userRole) => {
  return (
    project.clientId.toString() === userId.toString() ||
    userRole === 'supervisor'
  );
};

// GET /api/stages/project/:projectId – list all stages for a project
router.get('/project/:projectId', protect, asyncHandler(async (req, res) => {
  const stages = await Stage.find({ projectId: req.params.projectId }).sort('order');
  res.json({ success: true, stages });
}));

// GET /api/stages/:id – get a single stage
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const stage = await Stage.findById(req.params.id);
  if (!stage) throw new AppError('Stage not found', 404);
  res.json({ success: true, stage });
}));

// POST /api/stages – create a new stage
router.post('/', protect, asyncHandler(async (req, res) => {
  const { projectId, name, description, order, plannedStartDate, plannedEndDate } = req.body;

  if (!projectId || !name || order === undefined) {
    throw new AppError('Project ID, name, and order are required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (!canManageProject(project, req.user._id, req.user.role)) {
    throw new AppError('Not authorized to modify this project', 403);
  }

  const stage = await Stage.create({
    projectId,
    name,
    description: description || '',
    order,
    plannedStartDate: plannedStartDate || null,
    plannedEndDate: plannedEndDate || null
  });

  res.status(201).json({ success: true, stage });
}));

// PATCH /api/stages/:id – update a stage
router.patch('/:id', protect, asyncHandler(async (req, res) => {
  const stage = await Stage.findById(req.params.id).populate('projectId');
  if (!stage) throw new AppError('Stage not found', 404);

  if (!canManageProject(stage.projectId, req.user._id, req.user.role)) {
    throw new AppError('Not authorized to modify this stage', 403);
  }

  const allowed = [
    'name', 'description', 'order', 'status',
    'plannedStartDate', 'plannedEndDate',
    'actualStartDate', 'actualEndDate'
  ];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) stage[field] = req.body[field];
  });

  await stage.save();
  res.json({ success: true, stage });
}));

// DELETE /api/stages/:id – delete a stage (nullifies linked tasks)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const stage = await Stage.findById(req.params.id).populate('projectId');
  if (!stage) throw new AppError('Stage not found', 404);

  if (!canManageProject(stage.projectId, req.user._id, req.user.role)) {
    throw new AppError('Not authorized to delete this stage', 403);
  }

  // Nullify stageId on linked tasks so they move to "Ungrouped"
  const Request = mongoose.model('Request');
  const JobOffer = mongoose.model('JobOffer');
  await Promise.all([
    Request.updateMany({ stageId: stage._id }, { $set: { stageId: null } }),
    JobOffer.updateMany({ stageId: stage._id }, { $set: { stageId: null } })
  ]);

  await stage.deleteOne();
  res.json({ success: true, message: 'Stage deleted and tasks ungrouped' });
}));

export default router;
