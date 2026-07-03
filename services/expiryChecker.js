import ComplianceItem from '../models/ComplianceItem.js';
import Notification from '../models/Notification.js';

export const checkExpiringCompliance = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringItems = await ComplianceItem.find({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: 'approved' }
    }).populate('projectId');

    for (const item of expiringItems) {
      const project = item.projectId;
      if (!project) continue;

      // Notify the project client
      await Notification.create({
        userId: project.clientId,
        type: 'compliance_expiry',
        title: 'Compliance Item Expiring Soon',
        message: `"${item.title}" for project "${project.name}" expires on ${new Date(item.expiryDate).toLocaleDateString('en-IN')}.`,
        relatedId: item._id,
        actionUrl: `/compliance/${item._id}`
      });
    }

    console.log(`[Compliance] Checked expiry – ${expiringItems.length} item(s) expiring soon.`);
  } catch (err) {
    console.error('[Compliance] Expiry check failed:', err.message);
  }
};
