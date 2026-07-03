import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: String,
  profileQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  communication: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryTime: {
    type: Number,
    min: 1,
    max: 5
  },
  isRecommended: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to prevent duplicate reviews
reviewSchema.index({ fromUserId: 1, toUserId: 1, requestId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
