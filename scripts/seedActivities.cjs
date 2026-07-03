const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/service-marketplace').then(async () => {
  const Project = mongoose.model('Project', new mongoose.Schema({ name: String, clientId: mongoose.Schema.Types.ObjectId, createdAt: Date }));
  const Request = mongoose.model('Request', new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId, title: String, createdAt: Date, status: String }));
  const JobOffer = mongoose.model('JobOffer', new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId, title: String, createdAt: Date, status: String }));
  const Activity = mongoose.model('Activity', new mongoose.Schema({
    projectId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    description: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    relatedModel: String,
    createdAt: Date
  }));
  
  const id = new mongoose.Types.ObjectId('69c15db1f3b0736906dd11cb');
  const proj = await Project.findById(id);
  if (!proj) { console.log('Proj not found'); process.exit(); }
  
  await Activity.create({
    projectId: proj._id,
    userId: proj.clientId,
    type: 'project_created',
    description: `Project "${proj.name}" was created`,
    createdAt: proj.createdAt || new Date(Date.now() - 30*24*60*60*1000)
  });
  
  const reqs = await Request.find({ projectId: id });
  for (const r of reqs) {
    await Activity.create({
      projectId: proj._id,
      userId: proj.clientId,
      type: 'task_created',
      description: `New public request "${r.title}" was added`,
      relatedId: r._id,
      relatedModel: 'Request',
      createdAt: r.createdAt || new Date(Date.now() - 25*24*60*60*1000)
    });
    if(r.status === 'completed') {
      await Activity.create({
        projectId: proj._id,
        userId: proj.clientId,
        type: 'task_status_changed',
        description: `Task "${r.title}" is now completed`,
        relatedId: r._id,
        relatedModel: 'Request',
        createdAt: new Date(Date.now() - 10*24*60*60*1000)
      });
    }
  }
  
  const offers = await JobOffer.find({ projectId: id });
  for (const o of offers) {
    await Activity.create({
      projectId: proj._id,
      userId: proj.clientId,
      type: 'task_created',
      description: `New direct offer "${o.title}" was sent`,
      relatedId: o._id,
      relatedModel: 'JobOffer',
      createdAt: o.createdAt || new Date(Date.now() - 20*24*60*60*1000)
    });
  }
  
  console.log('Retroactively seeded activities for project!');
  process.exit();
}).catch(console.error);
