import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const cityCoordinates = {
  'Kochi': [76.2673, 9.9312], // [longitude, latitude]
  'Thiruvananthapuram': [76.9366, 8.5241],
  'Kozhikode': [75.7804, 11.2588],
  'Thrissur': [76.2144, 10.5276],
  'Kollam': [76.5890, 8.8932],
  'Alappuzha': [76.3300, 9.4981],
  'Kannur': [75.3704, 11.8745],
  'Kottayam': [76.5361, 9.5916]
};

const updateCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({ city: { $in: Object.keys(cityCoordinates) } });
    
    let updatedCount = 0;
    for (const user of users) {
      if (cityCoordinates[user.city]) {
        user.location = {
          type: 'Point',
          coordinates: cityCoordinates[user.city]
        };
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`Successfully updated GPS coordinates for ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating coordinates:', error);
    process.exit(1);
  }
};

updateCoordinates();
