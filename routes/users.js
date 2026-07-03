import express from 'express';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Request from '../models/Request.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Helper to build a 7 day preview
const generateAvailabilityPreview = (user) => {
  const preview = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const scheduleMap = new Map();
  if (user.availabilitySchedule) {
    user.availabilitySchedule.forEach(entry => {
      scheduleMap.set(new Date(entry.date).toISOString(), entry.status);
    });
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    const dateIso = d.toISOString();

    let status = user.availabilityStatus || 'available';
    if (scheduleMap.has(dateIso)) {
      status = scheduleMap.get(dateIso);
    }
    preview.push({ date: dateIso.split('T')[0], status });
  }
  return preview;
};

// ── Search providers (engineers and workers only) ──
// IMPORTANT: This must come BEFORE /:id to avoid the wildcard catching it
router.get('/', asyncHandler(async (req, res) => {
  const { role, expertise, minRating, city, search, specialization, availability, lat, lng, availableInNextDays, availableNext7Days } = req.query;
  let filter = { isActive: true };

  // Only return engineers, workers, and supervisors — never clients or admins
  if (role && ['engineer', 'worker', 'supervisor'].includes(role)) {
    filter.role = role;
  } else {
    filter.role = { $in: ['engineer', 'worker', 'supervisor'] };
  }

  if (minRating) filter.rating = { $gte: parseFloat(minRating) };
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (availability === 'true') filter.availability = true;

  // Expertise/skills filter — search across both expertise and skills arrays
  if (expertise) {
    filter.$or = [
      { expertise: { $regex: expertise, $options: 'i' } },
      { skills: { $regex: expertise, $options: 'i' } },
      { specialization: { $regex: expertise, $options: 'i' } },
      { qualification: { $regex: expertise, $options: 'i' } }
    ];
  }

  // Specialization filter
  if (specialization) {
    const specFilter = [
      { specialization: { $regex: specialization, $options: 'i' } },
      { qualification: { $regex: specialization, $options: 'i' } }
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: specFilter }];
      delete filter.$or;
    } else {
      filter.$or = specFilter;
    }
  }

  // General search — searches across ALL profile fields
  if (search) {
    const searchFilter = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { qualification: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } },
      { expertise: { $regex: search, $options: 'i' } },
      { portfolio: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { locationText: { $regex: search, $options: 'i' } }
    ];
    if (filter.$and) {
      filter.$and.push({ $or: searchFilter });
    } else if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
      delete filter.$or;
    } else {
      filter.$or = searchFilter;
    }
  }

  // ── If lat/lng provided, use $geoNear for distance-based sorting ──
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const matchStage = { ...filter };

      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            spherical: true,
            query: matchStage
          }
        },
        // Check if provider has real coordinates (not default [0,0])
        {
          $addFields: {
            hasRealLocation: {
              $not: {
                $and: [
                  { $eq: [{ $arrayElemAt: ['$location.coordinates', 0] }, 0] },
                  { $eq: [{ $arrayElemAt: ['$location.coordinates', 1] }, 0] }
                ]
              }
            }
          }
        },
        // Null out distance for providers without real coordinates
        {
          $addFields: {
            distance: {
              $cond: {
                if: '$hasRealLocation',
                then: '$distance',
                else: null
              }
            }
          }
        },
        // Sort: real-location providers first (by distance), then unknown
        { $sort: { hasRealLocation: -1, distance: 1 } },
        { $project: { password: 0, verificationToken: 0 } },
        { $limit: 50 }
      ];

      let providers = await User.aggregate(pipeline);

      if (availableInNextDays === 'true' || availableNext7Days === 'true') {
        providers = providers.map(p => ({
          ...p,
          availabilityPreview: generateAvailabilityPreview(p)
        }));
      }

      if (availableNext7Days === 'true') {
        providers = providers.filter(p =>
          p.availabilityPreview.some(day => day.status !== 'busy')
        );
      }

      return res.status(200).json({
        success: true,
        count: providers.length,
        users: providers,
        nearMeActive: true
      });
    }
  }

  // ── Default: no geolocation, sort by rating ──
  let users = await User.find(filter)
    .select('-password -verificationToken')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(50);

  if (availableInNextDays === 'true' || availableNext7Days === 'true') {
    users = users.map(u => {
      const dbObj = u.toObject();
      return {
        ...dbObj,
        availabilityPreview: generateAvailabilityPreview(dbObj)
      };
    });
  }

  if (availableNext7Days === 'true') {
    users = users.filter(u =>
      u.availabilityPreview.some(day => day.status !== 'busy')
    );
  }

  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
}));

// ── Update profile (legacy) ──
router.put('/profile/update', protect, asyncHandler(async (req, res) => {
  const {
    firstName, lastName, phone, bio, expertise, hourlyRate, city, country, profileImage
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName,
      lastName,
      phone,
      bio,
      expertise: expertise || [],
      hourlyRate,
      city,
      country,
      profileImage,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    user: user.getPublicProfile()
  });
}));

// ── Update current user profile (with image upload) ──
router.patch('/profile/me', protect, upload.single('profileImage'), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, city, country, locationText, latitude, longitude } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (bio !== undefined) updateData.bio = bio;
  if (city !== undefined) updateData.city = city;
  if (country !== undefined) updateData.country = country;
  if (locationText !== undefined) updateData.locationText = locationText;

  if (latitude && longitude) {
    updateData.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
  }

  // Worker-specific fields (only for worker role)
  if (req.user.role === 'worker') {
    const { skills, experience, hourlyRate, availability } = req.body;

    if (skills !== undefined) {
      try {
        updateData.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch {
        updateData.skills = [];
      }
    }
    if (experience !== undefined) updateData.experience = parseFloat(experience) || 0;
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate) || 0;
    if (availability !== undefined) updateData.availability = availability === 'true' || availability === true;
  }

  // Engineer-specific fields (only for engineer role)
  if (req.user.role === 'engineer') {
    const { qualification, specialization, portfolio, experience, hourlyRate } = req.body;

    if (qualification !== undefined) updateData.qualification = qualification;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = parseFloat(experience) || 0;
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate) || 0;
    if (portfolio !== undefined) {
      try {
        updateData.portfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio;
      } catch {
        updateData.portfolio = [];
      }
    }
  }

  // Supervisor-specific fields (reuses engineer fields)
  if (req.user.role === 'supervisor') {
    const { qualification, specialization, portfolio, experience, hourlyRate } = req.body;

    if (qualification !== undefined) updateData.qualification = qualification;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = parseFloat(experience) || 0;
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate) || 0;
    if (portfolio !== undefined) {
      try {
        updateData.portfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio;
      } catch {
        updateData.portfolio = [];
      }
    }
  }

  if (req.file) {
    updateData.profileImage = `/uploads/${req.file.filename}`;
  }

  updateData.updatedAt = new Date();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    user: user.getPublicProfile()
  });
}));

// ── Get user statistics ──
// IMPORTANT: This must come BEFORE /:id to avoid the wildcard catching '/stats/xxx'
router.get('/stats/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const completedRequests = await Request.countDocuments({
    $or: [{ clientId: user._id }, { hiredProviderId: user._id }],
    status: 'completed'
  });

  const totalRequests = await Request.countDocuments({
    $or: [{ clientId: user._id }, { hiredProviderId: user._id }]
  });

  const reviews = await Review.find({ toUserId: user._id });

  res.status(200).json({
    success: true,
    stats: {
      completedRequests,
      totalRequests,
      totalReviews: reviews.length,
      averageRating: user.rating,
      totalEarnings: user.totalEarnings
    }
  });
}));

// ── Get user profile by ID ──
// IMPORTANT: This MUST be the LAST GET route — /:id is a wildcard that catches everything
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user reviews
  const reviews = await Review.find({ toUserId: user._id })
    .populate('fromUserId', 'firstName lastName profileImage rating');

  res.status(200).json({
    success: true,
    user: user.getPublicProfile(),
    reviews,
    totalReviews: reviews.length
  });
}));

export default router;
