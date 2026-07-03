import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getMyAvailability,
    updateMyAvailability,
    updateSingleDayAvailability,
    getProviderAvailability
} from '../controllers/availabilityController.js';

const router = express.Router();

// Base middleware for all inside this module
router.use(protect);

// Provider managing their own schedule
router.route('/me')
    .get(getMyAvailability)
    .put(updateMyAvailability) // Bulk update map
    .patch(updateSingleDayAvailability); // Single day modify

// Clients getting a preview block of a specific provider's schedule
router.route('/:userId')
    .get(getProviderAvailability);

export default router;
