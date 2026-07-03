import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';

export const getTeamMembers = async (projectId) => {
    // Fetch all tasks for this project that have assigned providers
    const requests = await Request.find({ projectId }).populate('hiredProviderId', 'firstName lastName profileImage role');
    const offers = await JobOffer.find({ projectId }).populate('providerId', 'firstName lastName profileImage role');

    const providerMap = new Map();

    // Helper to add a provider and their assigned task
    const addProvider = (provider, task) => {
        if (!provider) return;
        const id = provider._id.toString();
        
        if (!providerMap.has(id)) {
            providerMap.set(id, {
                provider: provider.toObject ? provider.toObject() : provider,
                tasks: []
            });
        }
        
        providerMap.get(id).tasks.push({
            _id: task._id,
            title: task.title,
            type: task.constructor.modelName, // 'Request' or 'JobOffer'
            status: task.status
        });
    };

    // Public requests: include providers if the task is actively being worked on or finished
    requests.forEach(req => {
        if (req.hiredProviderId && ['in-progress', 'completed'].includes(req.status)) {
            addProvider(req.hiredProviderId, req);
        }
    });

    // Direct offers: include providers if they've accepted or completed the job
    offers.forEach(offer => {
        if (offer.providerId && ['accepted', 'completed'].includes(offer.status)) {
            addProvider(offer.providerId, offer);
        }
    });

    // Return an array of unique team members
    return Array.from(providerMap.values());
};
