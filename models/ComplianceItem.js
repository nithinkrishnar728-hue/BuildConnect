import mongoose from 'mongoose';

const complianceItemSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'ComplianceType', required: true },
  title: { type: String, required: true },
  description: { type: String },
  authority: { type: String },
  referenceNumber: { type: String },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'approved', 'rejected', 'expired'],
    default: 'not_started'
  },
  applicationDate: Date,
  issueDate: Date,
  expiryDate: Date,
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

complianceItemSchema.index({ projectId: 1, status: 1 });
complianceItemSchema.index({ expiryDate: 1 });

export default mongoose.model('ComplianceItem', complianceItemSchema);
