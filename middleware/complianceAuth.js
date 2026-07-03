import mongoose from 'mongoose';
import Project from '../models/Project.js';
import ComplianceItem from '../models/ComplianceItem.js';
import { AppError } from './errorHandler.js';

// Check if user can access/manage compliance items for a project
export const canAccessProjectCompliance = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) throw new AppError('Project ID required', 400);

    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    const userRole = req.user.role;
    const userId = req.user._id;

    // Client: access if they own the project
    if (userRole === 'client' && project.clientId.toString() === userId.toString()) {
      req.project = project;
      return next();
    }

    // Supervisor/Engineer/Worker: access if assigned to any task in the project
    const Request = mongoose.model('Request');
    const JobOffer = mongoose.model('JobOffer');

    const hasTask =
      await Request.exists({ projectId, hiredProviderId: userId }) ||
      await JobOffer.exists({ projectId, providerId: userId });

    if (hasTask) {
      req.project = project;
      return next();
    }

    throw new AppError('You do not have permission to access compliance for this project', 403);
  } catch (err) {
    next(err);
  }
};

// For single item access (GET /:id, PATCH /:id, DELETE /:id)
export const canAccessComplianceItem = async (req, res, next) => {
  try {
    const item = await ComplianceItem.findById(req.params.id).populate('projectId');
    if (!item) throw new AppError('Compliance item not found', 404);

    const project = item.projectId;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Client: access if they own the project
    if (userRole === 'client' && project.clientId.toString() === userId.toString()) {
      req.complianceItem = item;
      return next();
    }

    // Supervisor/Provider: access if linked to the project
    const Request = mongoose.model('Request');
    const JobOffer = mongoose.model('JobOffer');

    const hasTask =
      await Request.exists({ projectId: project._id, hiredProviderId: userId }) ||
      await JobOffer.exists({ projectId: project._id, providerId: userId });

    if (hasTask) {
      req.complianceItem = item;
      return next();
    }

    // Engineer/Worker: access if directly assigned to this item
    const isAssigned = item.assignedTo.some(id => id.toString() === userId.toString());
    if (isAssigned) {
      req.complianceItem = item;
      return next();
    }

    throw new AppError('You do not have permission to access this compliance item', 403);
  } catch (err) {
    next(err);
  }
};
