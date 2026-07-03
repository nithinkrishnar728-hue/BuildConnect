const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/service-marketplace').then(async () => {
    const ComplianceItem = mongoose.model('ComplianceItem', new mongoose.Schema({}, { strict: false }));
    const Project = mongoose.model('Project', new mongoose.Schema({ clientId: mongoose.Schema.Types.ObjectId, name: String }));
    const Notification = mongoose.model('Notification', new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId, type: String, title: String, message: String,
        read: { type: Boolean, default: false }, actionUrl: String, relatedId: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now }
    }));

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const items = await ComplianceItem.find({ expiryDate: { $gte: now, $lte: thirtyDaysLater } });
    console.log('Items expiring in 30 days:', items.length);

    for (const item of items) {
        const project = await Project.findById(item.projectId);
        if (!project) { console.log('No project for', item.title); continue; }
        await Notification.create({
            userId: project.clientId,
            type: 'compliance_expiry',
            title: 'Compliance Item Expiring Soon',
            message: `"${item.title}" for project "${project.name}" expires on ${new Date(item.expiryDate).toLocaleDateString('en-IN')}. Renew before the deadline!`,
            relatedId: item._id,
            actionUrl: `/compliance/${item._id}`
        });
        console.log('Notification created for:', item.title, '-> expires', item.expiryDate);
    }
    process.exit();
}).catch(console.error);
