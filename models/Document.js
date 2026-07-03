import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  complianceItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplianceItem',
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Document', documentSchema);
