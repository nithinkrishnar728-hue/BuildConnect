import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: {
    type: String,
    enum: [
      'project_created', 
      'task_created', 
      'task_status_changed', 
      'provider_hired', 
      'image_uploaded', 
      'comment_added'
    ],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  relatedId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  relatedModel: { 
    type: String, 
    enum: ['Request', 'JobOffer', 'User'] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Activity', activitySchema);
