import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    const user = await User.findOne({ firstName: /nithin/i });
    if (!user) {
      console.log("User not found");
      return;
    }
    console.log(`User: ${user.firstName} ${user.lastName} (${user._id})`);
    console.log(`Status: ${user.availabilityStatus}`);
    console.log(`Schedule length: ${user.availabilitySchedule ? user.availabilitySchedule.length : 0}`);
    if (user.availabilitySchedule) {
      user.availabilitySchedule.forEach(entry => {
        console.log(` - Date: ${entry.date.toISOString()} | Status: ${entry.status} | Note: ${entry.note}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
