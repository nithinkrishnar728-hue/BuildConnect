import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Project from '../models/Project.js';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Use memory storage so we can read req.body.projectId before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/documents – upload a document
router.post('/', protect, upload.single('file'), asyncHandler(async (req, res) => {
  const { projectId, description } = req.body;
  const file = req.file;

  if (!projectId || !file) {
    throw new AppError('Project ID and file are required', 400);
  }

  // Check if user has access to the project
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  // Authenticate user via Request or JobOffer links
  const isClient = project.clientId.toString() === req.user._id.toString();
  const isProvider = await Request.exists({ projectId, hiredProviderId: req.user._id }) ||
                     await JobOffer.exists({ projectId, providerId: req.user._id });

  if (!isClient && !isProvider) {
    throw new AppError('Not authorized to upload to this project', 403);
  }

  // Write buffer to disk now that we have the projectId
  const uploadDir = `uploads/projects/${projectId}`;
  fs.mkdirSync(uploadDir, { recursive: true });
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const fileName = `file-${uniqueSuffix}${ext}`;
  const filePath = `${uploadDir}/${fileName}`;
  fs.writeFileSync(filePath, file.buffer);

  const document = await Document.create({
    projectId,
    uploadedBy: req.user._id,
    fileName: file.originalname,
    filePath: filePath.replace(/\\/g, '/'),
    fileSize: file.size,
    fileType: file.mimetype,
    description: description || ''
  });

  res.status(201).json({
    success: true,
    document
  });
}));

// GET /api/documents/project/:projectId – list documents
router.get('/project/:projectId', protect, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  const isClient = project.clientId.toString() === req.user._id.toString();
  const isProvider = await Request.exists({ projectId, hiredProviderId: req.user._id }) ||
                     await JobOffer.exists({ projectId, providerId: req.user._id });
                     
  if (!isClient && !isProvider) {
    throw new AppError('Not authorized to view documents for this project', 403);
  }

  const documents = await Document.find({ projectId })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Document.countDocuments({ projectId });

  res.json({
    success: true,
    documents,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
}));

// GET /api/documents/:id/download – download file
router.get('/:id/download', protect, asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id).populate('projectId');
  if (!doc) throw new AppError('Document not found', 404);
  const project = doc.projectId;
  const isClient = project.clientId.toString() === req.user._id.toString();
  const isProvider = await Request.exists({ projectId: project._id, hiredProviderId: req.user._id }) ||
                     await JobOffer.exists({ projectId: project._id, providerId: req.user._id });
                     
  if (!isClient && !isProvider) {
    throw new AppError('Not authorized to download this document', 403);
  }

  const filePath = path.resolve(doc.filePath);
  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found on server', 404);
  }

  res.download(filePath, doc.fileName);
}));

export default router;
