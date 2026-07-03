import express from 'express';
import Project from '../models/Project.js';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import Activity from '../models/Activity.js';
import { getTeamMembers } from '../services/teamService.js';
import { protect, authorize } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All project routes require authentication
router.use(protect);

// Helper: compute all project stats from linked tasks
const calculateStats = async (projectId, projectBudget) => {
    const now = new Date();

    const [requests, jobOffers] = await Promise.all([
        Request.find({ projectId }),
        JobOffer.find({ projectId })
    ]);

    const allTasks = [
        ...requests.map(r => ({ ...r.toObject(), _taskType: 'request' })),
        ...jobOffers.map(o => ({ ...o.toObject(), _taskType: 'offer' }))
    ];

    let totalTasks = allTasks.length;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    let spent = 0;

    allTasks.forEach(task => {
        if (task.status === 'completed') {
            completedTasks++;
            spent += task.budget || task.offeredBudget || 0;
        } else if (task.status === 'in-progress' || task.status === 'accepted') {
            inProgressTasks++;
        }

        if (task.confirmedDate && new Date(task.confirmedDate) < now && task.status !== 'completed') {
            overdueTasks++;
        }
    });

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const budgetHealth = projectBudget && projectBudget > 0 ? (spent / projectBudget) * 100 : 0;

    return { totalTasks, completedTasks, inProgressTasks, overdueTasks, spent, progress, budgetHealth };
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Client only)
router.post('/', authorize('client'), asyncHandler(async (req, res) => {
    const { name, description, budget, startDate, estimatedEndDate } = req.body;

    const project = await Project.create({
        name,
        description,
        clientId: req.user._id,
        budget,
        startDate,
        estimatedEndDate
    });

    await Activity.create({
        projectId: project._id,
        userId: req.user._id,
        type: 'project_created',
        description: `Project "${project.name}" was created`
    });

    res.status(201).json(project);
}));

// @desc    Get all projects for logged-in client
// @route   GET /api/projects
// @access  Private (Client only)
router.get('/', authorize('client'), asyncHandler(async (req, res) => {
    const projects = await Project.find({ clientId: req.user._id }).sort('-createdAt');

    const projectsWithStats = await Promise.all(projects.map(async (project) => {
        const stats = await calculateStats(project._id, project.budget);
        project.spent = stats.spent;
        await project.save({ validateBeforeSave: false });
        return { ...project.toObject(), ...stats };
    }));

    res.json(projectsWithStats);
}));

// @desc    Get projects where the logged-in supervisor/engineer/worker is on the team
// @route   GET /api/projects/assigned
// @access  Private (supervisor, engineer, worker)
router.get('/assigned', asyncHandler(async (req, res) => {
    const allowedRoles = ['supervisor', 'engineer', 'worker'];
    if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('Only providers can access assigned projects', 403);
    }

    const [requestProjectIds, offerProjectIds] = await Promise.all([
        Request.find({ hiredProviderId: req.user._id, status: { $in: ['in-progress', 'completed'] } }).distinct('projectId'),
        JobOffer.find({ providerId: req.user._id, status: { $in: ['accepted', 'completed'] } }).distinct('projectId')
    ]);

    const projectIds = [...new Set([
        ...requestProjectIds.map(id => id.toString()),
        ...offerProjectIds.map(id => id.toString())
    ])];

    // Only return projects where the client explicitly granted access
    const projects = await Project.find({
        _id: { $in: projectIds },
        projectManagers: req.user._id
    }).sort('-updatedAt');

    const projectsWithStats = await Promise.all(projects.map(async (project) => {
        const stats = await calculateStats(project._id, project.budget);
        return { ...project.toObject(), ...stats };
    }));

    res.json(projectsWithStats);
}));

// @desc    Get a single project with its tasks
// @route   GET /api/projects/:id
// @access  Private (client owner OR assigned supervisor/engineer/worker)
router.get('/:id', asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const isClient = project.clientId.toString() === req.user._id.toString();

    // Allow only if explicitly granted dashboard access
    const isManager = !isClient && project.projectManagers?.some(
        id => id.toString() === req.user._id.toString()
    );

    if (!isClient && !isManager) {
        throw new AppError('Not authorized to access this project', 403);
    }

    const [stats, requests, jobOffers, team] = await Promise.all([
        calculateStats(project._id, project.budget),
        Request.find({ projectId: project._id }).populate('stageId', 'name order status plannedStartDate plannedEndDate'),
        JobOffer.find({ projectId: project._id }).populate('stageId', 'name order status plannedStartDate plannedEndDate'),
        getTeamMembers(project._id)
    ]);

    project.spent = stats.spent;
    await project.save({ validateBeforeSave: false });

    res.json({
        ...project.toObject(),
        viewerRole: isClient ? 'client' : 'member',
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
        overdueTasks: stats.overdueTasks,
        spent: stats.spent,
        progress: stats.progress,
        budgetHealth: stats.budgetHealth,
        team,
        tasks: {
            requests,
            jobOffers
        }
    });
}));

// @desc    Grant dashboard access to a team member
// @route   POST /api/projects/:id/grant-access/:userId
// @access  Private (Client only)
router.post('/:id/grant-access/:userId', authorize('client'), asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);
    if (project.clientId.toString() !== req.user._id.toString())
        throw new AppError('Not authorized', 403);

    const userId = req.params.userId;
    if (!project.projectManagers.some(id => id.toString() === userId)) {
        project.projectManagers.push(userId);
        await project.save();
    }

    res.json({ success: true, message: 'Dashboard access granted', projectManagers: project.projectManagers });
}));

// @desc    Revoke dashboard access from a team member
// @route   DELETE /api/projects/:id/revoke-access/:userId
// @access  Private (Client only)
router.delete('/:id/revoke-access/:userId', authorize('client'), asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);
    if (project.clientId.toString() !== req.user._id.toString())
        throw new AppError('Not authorized', 403);

    project.projectManagers = project.projectManagers.filter(
        id => id.toString() !== req.params.userId
    );
    await project.save();

    res.json({ success: true, message: 'Dashboard access revoked', projectManagers: project.projectManagers });
}));

// @desc    Update project
// @route   PATCH /api/projects/:id
// @access  Private (Client only)
router.patch('/:id', authorize('client'), asyncHandler(async (req, res) => {
    let project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to update this project', 403);
    }

    if (req.body.status === 'completed' && project.status !== 'completed') {
        req.body.actualEndDate = Date.now();
    }

    project = await Project.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.json(project);
}));

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Client only)
router.delete('/:id', authorize('client'), asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to delete this project', 403);
    }

    await Request.updateMany({ projectId: project._id }, { projectId: null });
    await JobOffer.updateMany({ projectId: project._id }, { projectId: null });

    await project.deleteOne();

    res.json({ message: 'Project removed and tasks unlinked' });
}));

// @desc    Get all tasks for a project
// @route   GET /api/projects/:id/tasks
// @access  Private
router.get('/:id/tasks', asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to access tasks for this project', 403);
    }

    const { status } = req.query;
    const filter = { projectId: project._id };
    if (status) filter.status = status;

    const [requests, jobOffers] = await Promise.all([
        Request.find(filter).populate('applications.provider', 'firstName lastName role'),
        JobOffer.find(filter).populate('providerId', 'firstName lastName role')
    ]);

    res.json({ requests, jobOffers });
}));

// @desc    Get spending timeline for a project
// @route   GET /api/projects/:id/spending-timeline
// @access  Private
router.get('/:id/spending-timeline', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    const isClient = project.clientId.toString() === req.user._id.toString();
    const isProvider = await Request.exists({ projectId: id, hiredProviderId: req.user._id }) ||
                       await JobOffer.exists({ projectId: id, providerId: req.user._id });

    if (!isClient && !isProvider) {
        throw new AppError('Not authorized to view analytics for this project', 403);
    }

    const requests = await Request.find({ projectId: id, status: 'completed' }).select('budget completedAt updatedAt');
    const offers = await JobOffer.find({ projectId: id, status: 'completed' }).select('offeredBudget completedAt updatedAt');
    const tasks = [...requests, ...offers];

    const spendingByDay = {};
    tasks.forEach(task => {
        const fallbackDate = task.completedAt || task.updatedAt || new Date();
        const date = new Date(fallbackDate).toISOString().split('T')[0];
        const amount = task.budget || task.offeredBudget || 0;
        spendingByDay[date] = (spendingByDay[date] || 0) + amount;
    });

    const sortedDates = Object.keys(spendingByDay).sort();
    let cumulative = 0;
    const timeline = sortedDates.map(date => {
        cumulative += spendingByDay[date];
        return { date, cumulativeSpent: cumulative };
    });

    res.json({ success: true, timeline });
}));

export default router;
