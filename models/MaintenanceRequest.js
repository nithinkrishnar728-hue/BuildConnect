import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    },
    originalOffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobOffer'
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'rejected'],
        default: 'pending'
    },
    scheduledDate: Date,
    responseMessage: String
}, { timestamps: true });

// Ensure at least one of originalRequest or originalOffer is present
maintenanceRequestSchema.pre('validate', function (next) {
    if (!this.originalRequest && !this.originalOffer) {
        next(new Error('Either originalRequest or originalOffer must be provided'));
    } else {
        next();
    }
});

maintenanceRequestSchema.index({ client: 1, status: 1 });
maintenanceRequestSchema.index({ provider: 1, status: 1 });

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
