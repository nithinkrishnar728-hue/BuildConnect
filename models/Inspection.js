import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
  complianceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ComplianceItem', required: true },
  scheduledDate: Date,
  completedDate: Date,
  inspector: String,
  result: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
  reportDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  notes: String
}, { timestamps: true });

export default mongoose.model('Inspection', inspectionSchema);
