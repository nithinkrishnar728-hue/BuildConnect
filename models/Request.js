import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['structural', 'electrical', 'plumbing', 'painting', 'carpentry', 'masonry', 'roofing', 'general-labor', 'other'],
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    enum: ['less-than-week', 'one-to-two-weeks', 'one-to-four-weeks', 'ongoing'],
    required: true
  },
  skillsRequired: [String],
  location: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'intermediate'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  stageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stage',
    default: null
  },
  proposedDate: {
    type: Date,
    default: null
  },
  confirmedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  hiredProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  applications: [{
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proposedPrice: Number,
    coverLetter: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [String],
  workImages: [{ type: String }],
  startDate: Date,
  endDate: Date,
  paymentReleased: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for search
requestSchema.index({ title: 'text', description: 'text' });
requestSchema.index({ category: 1, status: 1 });

export default mongoose.model('Request', requestSchema);
