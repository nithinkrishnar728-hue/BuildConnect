import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const cityCoordinates = {
  'Kochi': [76.2673, 9.9312],
  'Thiruvananthapuram': [76.9366, 8.5241],
  'Kozhikode': [75.7804, 11.2588],
  'Thrissur': [76.2144, 10.5276],
  'Kollam': [76.5890, 8.8932],
  'Alappuzha': [76.3300, 9.4981],
  'Kannur': [75.3704, 11.8745],
  'Kottayam': [76.5361, 9.5916]
};
const cities = Object.keys(cityCoordinates);

// Helper functions for random data generation
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomSubset = (arr, min, max) => {
  const count = getRandomInt(min, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateEngineers = () => {
  const firstNames = ['Rahul', 'Sreejith', 'Vishnu', 'Arun', 'Jithin', 'Sanal', 'Manu', 'Nikhil', 'Akhil', 'Vivek'];
  const lastNames = ['Menon', 'Nair', 'Pillai', 'Kumar', 'Varma', 'Panicker', 'Das', 'Iyer'];
  const qualifications = ['B.Tech Civil Engineering', 'M.Tech Structural', 'B.Arch', 'M.Tech Construction Management', 'Diploma in Civil Engineering'];
  const specializations = ['Residential Construction', 'Commercial Buildings', 'Structural Design', 'Project Management', 'Interior Design'];

  const results = [];
  for (let i = 0; i < 10; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = getRandom(lastNames);
      const assignedCity = getRandom(cities);
      results.push({
      firstName: fName,
      lastName: lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@buildconnect.com`,
      password: 'password123',
      role: 'engineer',
      qualification: getRandom(qualifications),
      specialization: getRandom(specializations),
      experience: getRandomInt(3, 20),
      hourlyRate: getRandomInt(800, 2000),
      city: assignedCity,
      locationText: 'Kerala, India',
      location: {
        type: 'Point',
        coordinates: cityCoordinates[assignedCity]
      }
    });
  }
  return results;
};

const generateWorkers = () => {
  const firstNames = ['Suresh', 'Ramesh', 'Manoj', 'Sunil', 'Rajesh', 'Jayaprakash', 'Sasi', 'Biju', 'Shaji', 'Jose', 'Prasad', 'Santhosh', 'Anil', 'Mohan', 'Gopi'];
  const skillsList = ['Masonry', 'Plumbing', 'Electrical', 'Tiling', 'Painting', 'Carpentry', 'Roofing', 'Welding', 'Steel Fixing', 'Formwork'];

  const results = [];
  for (let i = 0; i < 15; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = 'Worker'; // Added to satisfy required lastName field in the User schema
    const assignedCity = getRandom(cities);
    results.push({
      firstName: fName,
      lastName: lName,
      email: `${fName.toLowerCase()}.worker@buildconnect.com`,
      password: 'password123',
      role: 'worker',
      skills: getRandomSubset(skillsList, 2, 4),
      experience: getRandomInt(1, 20),
      hourlyRate: getRandomInt(300, 800),
      availability: true,
      city: assignedCity,
      locationText: 'Kerala, India',
      location: {
        type: 'Point',
        coordinates: cityCoordinates[assignedCity]
      }
    });
  }
  return results;
};

const generateSupervisors = () => {
  const firstNames = ['George', 'Mathew', 'Jacob', 'Thomas', 'Philip'];
  const lastNames = ['Cherian', 'Chacko', 'John', 'Paul', 'Varghese', 'Joseph'];
  const qualifications = ['Diploma in Civil Engineering', 'B.Tech Civil', 'Construction Management'];

  const results = [];
  for (let i = 0; i < 5; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = getRandom(lastNames);
    const assignedCity = getRandom(cities);
    results.push({
      firstName: fName,
      lastName: lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@buildconnect.com`,
      password: 'password123',
      role: 'supervisor',
      qualification: getRandom(qualifications),
      experience: getRandomInt(8, 25),
      hourlyRate: getRandomInt(1000, 2500),
      city: assignedCity,
      locationText: 'Kerala, India',
      location: {
        type: 'Point',
        coordinates: cityCoordinates[assignedCity]
      }
    });
  }
  return results;
};

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    // Ensure MONGODB_URI is set in your .env file
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in the environment. Make sure to create a .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const engineers = generateEngineers();
    let engCount = 0;
    for (const u of engineers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User(u).save();
        engCount++;
      }
    }
    console.log(`Added ${engCount} engineers.`);

    const workers = generateWorkers();
    let wCount = 0;
    for (const u of workers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User(u).save();
        wCount++;
      }
    }
    console.log(`Added ${wCount} workers.`);

    const supervisors = generateSupervisors();
    let supCount = 0;
    for (const u of supervisors) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User(u).save();
        supCount++;
      }
    }
    console.log(`Added ${supCount} supervisors.`);

    console.log('All done.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

runSeed();
