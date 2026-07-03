import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ComplianceItem from '../models/ComplianceItem.js';
import ComplianceType from '../models/ComplianceType.js';
import Inspection from '../models/Inspection.js';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { canAccessProjectCompliance, canAccessComplianceItem } from '../middleware/complianceAuth.js';

const router = express.Router();

// ── Multer for compliance document uploads ──────────────────────────────────
const complianceDocsDir = 'uploads/compliance';
if (!fs.existsSync(complianceDocsDir)) {
  fs.mkdirSync(complianceDocsDir, { recursive: true });
}

const complianceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, complianceDocsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `compliance-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const uploadDoc = multer({ storage: complianceStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Seed default compliance types on startup ─────────────────────────────────
const defaultTypes = [
  { name: 'Permit',          icon: '📜', color: '#3b82f6' },
  { name: 'Inspection',      icon: '🔍', color: '#f59e0b' },
  { name: 'Certificate',     icon: '📄', color: '#10b981' },
  { name: 'Insurance',       icon: '🛡️', color: '#8b5cf6' },
  { name: 'License',         icon: '🎫', color: '#ec4899' },
  { name: 'Safety Document', icon: '⚠️', color: '#ef4444' }
];

ComplianceType.insertMany(defaultTypes, { ordered: false })
  .catch(() => {}); // silently ignore duplicates on re-start

// ── GET /api/compliance/types ─────────────────────────────────────────────────
router.get('/types', protect, asyncHandler(async (req, res) => {
  const types = await ComplianceType.find().sort('name');
  res.json({ success: true, types });
}));

// ── GET /api/compliance/assigned-to-me ───────────────────────────────────────
router.get('/assigned-to-me', protect, asyncHandler(async (req, res) => {
  const items = await ComplianceItem.find({ assignedTo: req.user._id })
    .populate('projectId', 'name')
    .populate('type', 'name icon color');
  res.json({ success: true, items });
}));

// ── GET /api/compliance/project/:projectId/summary ────────────────────────────
router.get('/project/:projectId/summary', protect, canAccessProjectCompliance, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const items = await ComplianceItem.find({ projectId });
  const total = items.length;
  const completed = items.filter(i => i.status === 'approved').length;
  const inProgress = items.filter(i => ['in_progress', 'submitted'].includes(i.status)).length;
  const expired = items.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date() && i.status !== 'approved').length;
  const pending = total - completed;

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const upcomingExpiries = items.filter(
    i => i.expiryDate &&
         new Date(i.expiryDate) <= thirtyDaysFromNow &&
         new Date(i.expiryDate) >= new Date() &&
         i.status !== 'approved'
  );

  res.json({
    success: true,
    summary: {
      total, completed, inProgress, expired, pending,
      upcomingExpiries: upcomingExpiries.map(i => ({
        _id: i._id, title: i.title, expiryDate: i.expiryDate
      }))
    }
  });
}));

// ── GET /api/compliance/project/:projectId ────────────────────────────────────
router.get('/project/:projectId', protect, canAccessProjectCompliance, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const items = await ComplianceItem.find({ projectId })
    .populate('type', 'name icon color')
    .populate('documents')
    .populate('assignedTo', 'firstName lastName role')
    .sort({ createdAt: -1 });
  res.json({ success: true, items });
}));

// ── GET /api/compliance/:id ───────────────────────────────────────────────────
router.get('/:id', protect, canAccessComplianceItem, asyncHandler(async (req, res) => {
  const item = await ComplianceItem.findById(req.params.id)
    .populate('type')
    .populate('documents')
    .populate('assignedTo', 'firstName lastName role')
    .populate('createdBy', 'firstName lastName');
  if (!item) throw new AppError('Compliance item not found', 404);
  const inspections = await Inspection.find({ complianceItemId: item._id }).populate('reportDocument');
  res.json({ success: true, item, inspections });
}));

// ── POST /api/compliance ──────────────────────────────────────────────────────
router.post('/', protect, canAccessProjectCompliance, asyncHandler(async (req, res) => {
  const { projectId, typeId, title, description, authority, referenceNumber, status, applicationDate, issueDate, expiryDate, assignedTo, notes } = req.body;

  if (!projectId || !typeId || !title) {
    throw new AppError('Project ID, type, and title are required', 400);
  }

  const newItem = await ComplianceItem.create({
    projectId,
    type: typeId,
    title,
    description,
    authority,
    referenceNumber,
    status: status || 'not_started',
    applicationDate,
    issueDate,
    expiryDate,
    assignedTo: assignedTo || [],
    notes,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  const populated = await newItem.populate('type', 'name icon color');
  res.status(201).json({ success: true, item: populated });
}));

// ── PATCH /api/compliance/:id ─────────────────────────────────────────────────
router.patch('/:id', protect, canAccessComplianceItem, asyncHandler(async (req, res) => {
  const item = req.complianceItem || await ComplianceItem.findById(req.params.id);
  if (!item) throw new AppError('Compliance item not found', 404);

  const allowedFields = ['title', 'description', 'authority', 'referenceNumber', 'status', 'applicationDate', 'issueDate', 'expiryDate', 'assignedTo', 'notes'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });
  item.updatedBy = req.user._id;
  await item.save();

  res.json({ success: true, item });
}));

// ── DELETE /api/compliance/:id ────────────────────────────────────────────────
router.delete('/:id', protect, canAccessComplianceItem, asyncHandler(async (req, res) => {
  const item = req.complianceItem || await ComplianceItem.findById(req.params.id);
  if (!item) throw new AppError('Compliance item not found', 404);
  await Inspection.deleteMany({ complianceItemId: item._id });
  await ComplianceItem.findByIdAndDelete(item._id);
  res.json({ success: true, message: 'Compliance item deleted' });
}));

// ── POST /api/compliance/:id/documents ────────────────────────────────────────
router.post('/:id/documents', protect, canAccessComplianceItem, uploadDoc.single('file'), asyncHandler(async (req, res) => {
  const item = req.complianceItem || await ComplianceItem.findById(req.params.id);
  if (!item) throw new AppError('Compliance item not found', 404);
  if (!req.file) throw new AppError('File is required', 400);

  const doc = await Document.create({
    projectId: item.projectId,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    filePath: req.file.path.replace(/\\/g, '/'),
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    description: req.body.description || '',
    complianceItemId: item._id
  });

  item.documents.push(doc._id);
  await item.save();

  res.status(201).json({ success: true, document: doc });
}));

// ── POST /api/compliance/:id/inspections ──────────────────────────────────────
router.post('/:id/inspections', protect, canAccessComplianceItem, asyncHandler(async (req, res) => {
  const { scheduledDate, inspector, notes } = req.body;
  const inspection = await Inspection.create({
    complianceItemId: req.params.id,
    scheduledDate,
    inspector: inspector || 'Pending',
    notes
  });
  res.status(201).json({ success: true, inspection });
}));

// ── PATCH /api/compliance/inspections/:id ─────────────────────────────────────
router.patch('/inspections/:id', protect, asyncHandler(async (req, res) => {
  const { result, completedDate, reportDocumentId, notes } = req.body;
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) throw new AppError('Inspection not found', 404);
  if (result) inspection.result = result;
  if (completedDate) inspection.completedDate = completedDate;
  if (reportDocumentId) inspection.reportDocument = reportDocumentId;
  if (notes) inspection.notes = notes;
  await inspection.save();
  res.json({ success: true, inspection });
}));

export default router;
