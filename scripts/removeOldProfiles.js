import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const removeOldProfiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const emailsToRemove = [
      'engineer@test.com',
      'worker@test.com',
      'client@test.com'
    ];

    const result = await User.deleteMany({ email: { $in: emailsToRemove } });
    console.log(`Deleted ${result.deletedCount} old test professionals.`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

removeOldProfiles();
