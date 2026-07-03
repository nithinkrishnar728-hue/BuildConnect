import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['fraud', 'inappropriate_content', 'spam', 'fake_profile', 'harassment', 'other']
    },
    description: {
        type: String,
        maxLength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    actionTaken: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
