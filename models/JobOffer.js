import mongoose from 'mongoose';

const jobOfferSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    providerId: {
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
    offeredBudget: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        enum: ['less-than-week', 'one-to-two-weeks', 'one-to-four-weeks', 'ongoing'],
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
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
        enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
        default: 'pending'
    },
    declineReason: {
        type: String,
        default: ''
    },
    completedAt: {
        type: Date,
        default: null
    },
    workImages: [{ type: String }]
}, { timestamps: true });

jobOfferSchema.index({ clientId: 1, status: 1 });
jobOfferSchema.index({ providerId: 1, status: 1 });

export default mongoose.model('JobOffer', jobOfferSchema);
