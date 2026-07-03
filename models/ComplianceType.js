import mongoose from 'mongoose';

const complianceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: '📄' },
  color: { type: String, default: '#6b7280' }
});

export default mongoose.model('ComplianceType', complianceTypeSchema);
