import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'delayed'],
    default: 'not_started'
  },
  plannedStartDate: { type: Date, default: null },
  plannedEndDate: { type: Date, default: null },
  actualStartDate: { type: Date, default: null },
  actualEndDate: { type: Date, default: null }
}, { timestamps: true });

// Unique order per project
stageSchema.index({ projectId: 1, order: 1 }, { unique: true });

export default mongoose.model('Stage', stageSchema);
