import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['planning', 'in-progress', 'completed', 'on-hold'],
        default: 'planning'
    },
    budget: Number,
    spent: { type: Number, default: 0 }, // will be updated when tasks are completed
    // Providers explicitly granted dashboard management access by the client
    projectManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: Date,
    estimatedEndDate: Date,
    actualEndDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

projectSchema.index({ clientId: 1 });

export default mongoose.model('Project', projectSchema);
