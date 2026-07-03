import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Request.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Hash password once for all users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create construction-themed users
    const users = await User.insertMany([
      // --- Test Accounts ---
      {
        firstName: 'Amit',
        lastName: 'Sharma',
        email: 'client@test.com',
        password: hashedPassword,
        role: 'client',
        bio: 'Building a residential complex in Mumbai. Looking for reliable engineers and workers.',
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.5,
        reviewCount: 3
      },
      {
        firstName: 'Vikram',
        lastName: 'Desai',
        email: 'engineer@test.com',
        password: hashedPassword,
        role: 'engineer',
        bio: 'Licensed structural engineer with 8+ years of experience in high-rise residential and commercial projects.',
        expertise: ['Structural Analysis', 'RCC Design', 'Foundation Engineering'],
        qualification: 'M.Tech Structural Engineering',
        specialization: 'Structural Engineering',
        experience: 8,
        hourlyRate: 1500,
        portfolio: ['22-floor residential tower in Andheri', 'Commercial complex structural audit in Pune'],
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.8,
        reviewCount: 12
      },
      {
        firstName: 'Suresh',
        lastName: 'Yadav',
        email: 'worker@test.com',
        password: hashedPassword,
        role: 'worker',
        bio: 'Experienced mason and general construction worker. Reliable and hardworking.',
        expertise: ['Masonry', 'Concrete Work'],
        skills: ['Masonry', 'Concrete Pouring', 'Brickwork', 'Plastering'],
        experience: 10,
        hourlyRate: 450,
        availability: true,
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.3,
        reviewCount: 8
      },

      // --- Additional Engineers ---
      {
        firstName: 'Sneha',
        lastName: 'Patel',
        email: 'sneha@buildconnect.com',
        password: hashedPassword,
        role: 'engineer',
        bio: 'Award-winning interior designer and architect specializing in luxury residential spaces.',
        expertise: ['Interior Design', 'Space Planning', '3D Visualization'],
        qualification: 'B.Arch',
        specialization: 'Interior Design',
        experience: 10,
        hourlyRate: 1200,
        portfolio: ['Luxury villa interiors in Juhu', 'Boutique hotel lobby design in Goa', 'Premium apartment makeover in Bandra'],
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.9,
        reviewCount: 22
      },
      {
        firstName: 'Rahul',
        lastName: 'Mehta',
        email: 'rahul@buildconnect.com',
        password: hashedPassword,
        role: 'engineer',
        bio: 'Senior structural engineer specialized in earthquake-resistant design and retrofitting.',
        expertise: ['Structural Design', 'Seismic Analysis', 'Retrofitting'],
        qualification: 'M.Tech Structural',
        specialization: 'Structural Engineering',
        experience: 12,
        hourlyRate: 1500,
        portfolio: ['Hospital seismic retrofitting in Pune', 'Bridge design for state highway project'],
        city: 'Pune',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.7,
        reviewCount: 18
      },
      {
        firstName: 'Priya',
        lastName: 'Nair',
        email: 'priya@buildconnect.com',
        password: hashedPassword,
        role: 'engineer',
        bio: 'MEP engineer with expertise in green building systems and sustainable construction.',
        expertise: ['MEP Design', 'HVAC', 'Green Building'],
        qualification: 'B.E. Mechanical',
        specialization: 'MEP Engineering',
        experience: 6,
        hourlyRate: 1000,
        portfolio: ['LEED-certified office building in Hyderabad', 'Solar-powered housing complex'],
        city: 'Bangalore',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.6,
        reviewCount: 9
      },

      // --- Additional Workers ---
      {
        firstName: 'Raj',
        lastName: 'Kumar',
        email: 'raj@buildconnect.com',
        password: hashedPassword,
        role: 'worker',
        bio: 'Skilled plumber and mason with 7 years of construction site experience.',
        expertise: ['Masonry', 'Plumbing'],
        skills: ['Masonry', 'Plumbing', 'Pipe Fitting', 'Water Proofing'],
        experience: 7,
        hourlyRate: 500,
        availability: true,
        city: 'Delhi',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.4,
        reviewCount: 15
      },
      {
        firstName: 'Meena',
        lastName: 'Singh',
        email: 'meena@buildconnect.com',
        password: hashedPassword,
        role: 'worker',
        bio: 'Specialist in tiling, painting, and interior finishing. Attention to quality and detail.',
        expertise: ['Tiling', 'Painting'],
        skills: ['Tiling', 'Painting', 'Wall Texturing', 'POP Work'],
        experience: 4,
        hourlyRate: 350,
        availability: true,
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.5,
        reviewCount: 11
      },
      {
        firstName: 'Ravi',
        lastName: 'Electricals',
        email: 'ravi@buildconnect.com',
        password: hashedPassword,
        role: 'worker',
        bio: 'Licensed electrician specializing in residential and commercial wiring, panel installation, and safety systems.',
        expertise: ['Electrical Wiring', 'Panel Installation'],
        skills: ['Electrical Wiring', 'Panel Installation', 'Earthing', 'Switchboard Assembly'],
        experience: 9,
        hourlyRate: 600,
        availability: false,
        city: 'Pune',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.6,
        reviewCount: 20
      },

      // --- Supervisor ---
      {
        firstName: 'Anil',
        lastName: 'Kapoor',
        email: 'supervisor@test.com',
        password: hashedPassword,
        role: 'supervisor',
        bio: 'Experienced site supervisor with 12+ years overseeing large-scale residential and commercial construction projects. Expert in quality control, safety compliance, and team coordination.',
        expertise: ['Site Supervision', 'Quality Control', 'Safety Compliance'],
        qualification: 'B.Tech Civil Engineering',
        specialization: 'Site Supervision',
        experience: 12,
        hourlyRate: 800,
        portfolio: ['Supervised 300-unit residential complex in Thane', 'Commercial mall construction supervision in Navi Mumbai', 'Highway bridge project site management'],
        city: 'Mumbai',
        country: 'India',
        verified: true,
        isActive: true,
        rating: 4.7,
        reviewCount: 14
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create construction requests (using new categories)
    const client = users[0];
    const requests = await Request.insertMany([
      {
        title: 'Structural Assessment for 3-Story Building',
        description: 'Need a qualified structural engineer to assess the foundation and load-bearing walls of a 3-story residential building before renovation.',
        category: 'structural',
        budget: 25000,
        duration: 'one-to-two-weeks',
        skillsRequired: ['Structural Analysis', 'RCC Design', 'Foundation Engineering'],
        experienceLevel: 'expert',
        clientId: client._id,
        status: 'open',
        views: 78
      },
      {
        title: 'Complete Plumbing for New Apartment',
        description: 'Full plumbing installation for a new 2BHK apartment. Includes kitchen, 2 bathrooms, balcony drainage.',
        category: 'plumbing',
        budget: 15000,
        duration: 'one-to-two-weeks',
        skillsRequired: ['Plumbing', 'Pipe Fitting', 'Water Proofing'],
        experienceLevel: 'intermediate',
        clientId: client._id,
        status: 'open',
        views: 45
      },
      {
        title: 'Electrical Wiring for Office Space',
        description: 'Complete electrical work for a 2000 sq ft office space. Wiring, panels, switches, and earthing.',
        category: 'electrical',
        budget: 35000,
        duration: 'one-to-two-weeks',
        skillsRequired: ['Electrical Wiring', 'Panel Installation'],
        experienceLevel: 'intermediate',
        clientId: client._id,
        status: 'open',
        views: 62
      },
      {
        title: 'Interior Painting — 3BHK Flat',
        description: 'Looking for painters to do full interior painting of a 3BHK flat in Andheri West. Asian Paints Royale finish.',
        category: 'painting',
        budget: 8000,
        duration: 'less-than-week',
        skillsRequired: ['Painting', 'Wall Texturing'],
        experienceLevel: 'beginner',
        clientId: client._id,
        status: 'open',
        views: 112
      },
      {
        title: 'Roofing Repair After Monsoon',
        description: 'Multiple leakage points on rooftop slab. Need waterproofing and minor structural repair.',
        category: 'roofing',
        budget: 20000,
        duration: 'one-to-two-weeks',
        skillsRequired: ['Masonry', 'Water Proofing'],
        experienceLevel: 'intermediate',
        clientId: client._id,
        status: 'open',
        views: 34
      }
    ]);

    console.log(`✅ Created ${requests.length} requests`);

    // Create reviews
    const reviews = await Review.insertMany([
      {
        fromUserId: client._id,
        toUserId: users[1]._id,  // Vikram engineer
        requestId: requests[0]._id,
        rating: 5,
        title: 'Outstanding structural assessment',
        comment: 'Vikram provided a thorough structural report with clear recommendations. Very professional.',
        profileQuality: 5,
        communication: 5,
        deliveryTime: 5,
        isRecommended: true
      },
      {
        fromUserId: client._id,
        toUserId: users[3]._id,  // Sneha engineer
        requestId: requests[0]._id,
        rating: 5,
        title: 'Beautiful interior work',
        comment: 'Sneha transformed our living space completely. Her design sense is exceptional.',
        profileQuality: 5,
        communication: 5,
        deliveryTime: 4,
        isRecommended: true
      }
    ]);

    console.log(`✅ Created ${reviews.length} reviews`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: client@test.com    | Password: password123 | Role: client');
    console.log('   Email: engineer@test.com  | Password: password123 | Role: engineer');
    console.log('   Email: worker@test.com    | Password: password123 | Role: worker');
    console.log('   Email: supervisor@test.com| Password: password123 | Role: supervisor');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
