import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: String,
  role: {
    type: String,
    enum: ['client', 'engineer', 'worker', 'admin', 'supervisor'],
    default: 'client'
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: String,
  expertise: [String],
  // Engineer-specific fields
  qualification: String,
  specialization: String,
  portfolio: [String],
  // Worker-specific fields
  skills: [String],
  availability: {
    type: Boolean,
    default: true
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'away', 'limited'],
    default: 'available'
  },
  availabilitySchedule: [{
    date: { type: Date, required: true },      // specific date (store as UTC date at midnight)
    status: { type: String, enum: ['available', 'busy', 'limited'] },
    note: String
  }],
  recurringUnavailable: [{
    dayOfWeek: Number,          // 0-6 (Sunday=0)
    startTime: String,          // optional, format "HH:MM"
    endTime: String
  }],
  // Shared field
  experience: Number,
  hourlyRate: Number,
  city: String,
  country: String,
  locationText: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  completedRequests: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  return obj;
};

// Geospatial index for "near me" distance queries
userSchema.index({ location: '2dsphere' });

export default mongoose.model('User', userSchema);
