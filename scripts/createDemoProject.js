import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import Request from '../models/Request.js';
import JobOffer from '../models/JobOffer.js';
import ComplianceType from '../models/ComplianceType.js';
import ComplianceItem from '../models/ComplianceItem.js';
import Document from '../models/Document.js';

dotenv.config();

const getProvider = async (email, fallbackRole) => {
  if (email && email !== '(none)') {
    const p = await User.findOne({ email });
    if (p) return p;
  }
  // Fallback to random of role
  const fallback = await User.findOne({ role: fallbackRole });
  return fallback;
};

const run = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Get or Create Client
    let client = await User.findOne({ email: 'vivinvarghese08@gmail.com' });
    if (!client) {
      console.log('Client vivinvarghese08@gmail.com not found. Creating...');
      client = await User.create({
        firstName: 'Vivin',
        lastName: 'Varghese',
        email: 'vivinvarghese08@gmail.com',
        password: 'password123',
        role: 'client'
      });
    }

    // 2. Clear old demo project if it exists so we can rerun cleanly
    const existing = await Project.findOne({ name: 'Technopark Shopping Complex', clientId: client._id });
    if (existing) {
      console.log('Removing old demo project data...');
      await Stage.deleteMany({ projectId: existing._id });
      await Request.deleteMany({ projectId: existing._id });
      await JobOffer.deleteMany({ projectId: existing._id });
      await ComplianceItem.deleteMany({ projectId: existing._id });
      await Document.deleteMany({ projectId: existing._id });
      await Project.deleteOne({ _id: existing._id });
    }

    // 3. Create Project
    const project = await Project.create({
      name: 'Technopark Shopping Complex',
      description: 'A modern 3-storey shopping complex with retail spaces, food court, and parking. Located in Kochi, Kerala.',
      clientId: client._id,
      budget: 50000000, // 5 Cr
      startDate: new Date('2026-01-15'),
      estimatedEndDate: new Date('2027-06-30'),
      status: 'in-progress',
      spent: 4000000 // roughly based on completed tasks
    });

    console.log(`Created Project: ${project.name}`);

    // 4. Create Stages
    const stagesData = [
      { order: 1, name: 'Site Preparation', plannedStart: '2026-01-15', plannedEnd: '2026-02-15', desc: 'Clearing, grading, utilities relocation', status: 'completed' },
      { order: 2, name: 'Foundation', plannedStart: '2026-02-16', plannedEnd: '2026-04-15', desc: 'Excavation, pile foundation, concrete', status: 'in_progress' },
      { order: 3, name: 'Structural Framing', plannedStart: '2026-04-16', plannedEnd: '2026-07-15', desc: 'Columns, beams, slabs (RCC)', status: 'not_started' },
      { order: 4, name: 'Roofing', plannedStart: '2026-07-16', plannedEnd: '2026-09-15', desc: 'Roof trusses, sheathing, waterproofing', status: 'not_started' },
      { order: 5, name: 'Exterior Finishes', plannedStart: '2026-09-16', plannedEnd: '2026-11-15', desc: 'Brickwork, plastering, cladding', status: 'not_started' },
      { order: 6, name: 'Electrical', plannedStart: '2026-08-01', plannedEnd: '2026-12-15', desc: 'Rough-in, wiring, panel installation', status: 'not_started' },
      { order: 7, name: 'Plumbing', plannedStart: '2026-08-01', plannedEnd: '2026-12-15', desc: 'Rough-in, pipework, fixture rough-in', status: 'not_started' },
      { order: 8, name: 'HVAC', plannedStart: '2026-10-01', plannedEnd: '2027-02-15', desc: 'Ductwork, equipment installation', status: 'not_started' },
      { order: 9, name: 'Interior Finishes', plannedStart: '2027-01-01', plannedEnd: '2027-04-30', desc: 'Drywall, painting, flooring, ceilings', status: 'not_started' },
      { order: 10, name: 'Fixtures & Finishes', plannedStart: '2027-05-01', plannedEnd: '2027-06-30', desc: 'Lighting, plumbing fixtures, final touches', status: 'not_started' }
    ];

    const stageMap = {};
    for (const st of stagesData) {
      const doc = await Stage.create({
        projectId: project._id,
        name: st.name,
        description: st.desc,
        order: st.order,
        status: st.status,
        plannedStartDate: new Date(st.plannedStart),
        plannedEndDate: new Date(st.plannedEnd),
        actualStartDate: st.status === 'completed' || st.status === 'in_progress' ? new Date(st.plannedStart) : null,
        actualEndDate: st.status === 'completed' ? new Date(st.plannedEnd) : null
      });
      stageMap[st.order] = doc._id;
    }

    console.log('Created 10 Stages');

    // 5. Tasks (Requests / Offers)
    const rawTasks = [
      // Stage 1
      { stage: 1, title: 'Site Clearing & Excavation', budget: 500000, status: 'completed', provider: 'suresh.worker@buildconnect.com', type: 'request', cat: 'general-labor', fRole: 'worker' },
      { stage: 1, title: 'Geotechnical Survey', budget: 200000, status: 'completed', provider: 'rahul.menon@buildconnect.com', type: 'request', cat: 'other', fRole: 'engineer' },
      // Stage 2
      { stage: 2, title: 'Pile Foundation Work', budget: 1500000, status: 'in_progress', provider: 'manoj.worker@buildconnect.com', type: 'offer', cat: 'masonry', fRole: 'worker' },
      { stage: 2, title: 'Concrete Pouring', budget: 800000, status: 'pending', provider: '(none)', type: 'request', cat: 'masonry', fRole: 'worker' },
      // Stage 3
      { stage: 3, title: 'Column Reinforcement', budget: 1000000, status: 'in_progress', provider: 'sunil.worker@buildconnect.com', type: 'request', cat: 'structural', fRole: 'worker' },
      { stage: 3, title: 'Slab Formwork', budget: 700000, status: 'completed', provider: 'rajesh.worker@buildconnect.com', type: 'offer', cat: 'carpentry', fRole: 'worker' },
      { stage: 3, title: 'Steel Fixing', budget: 900000, status: 'pending', provider: '(none)', type: 'request', cat: 'structural', fRole: 'worker' },
      // Stage 4
      { stage: 4, title: 'Roof Truss Installation', budget: 600000, status: 'pending', provider: '(none)', type: 'request', cat: 'roofing', fRole: 'worker' },
      // Stage 5
      { stage: 5, title: 'Brickwork & Plastering', budget: 800000, status: 'not_started', provider: '(none)', type: 'request', cat: 'masonry', fRole: 'worker' },
      { stage: 5, title: 'Cladding Installation', budget: 500000, status: 'not_started', provider: '(none)', type: 'request', cat: 'other', fRole: 'worker' },
      // Stage 6
      { stage: 6, title: 'Electrical Rough-in', budget: 400000, status: 'not_started', provider: '(none)', type: 'request', cat: 'electrical', fRole: 'worker' },
      { stage: 6, title: 'Panel Installation', budget: 350000, status: 'not_started', provider: '(none)', type: 'request', cat: 'electrical', fRole: 'worker' },
      // Stage 7
      { stage: 7, title: 'Plumbing Rough-in', budget: 350000, status: 'not_started', provider: '(none)', type: 'request', cat: 'plumbing', fRole: 'worker' },
      { stage: 7, title: 'Fixture Rough-in', budget: 250000, status: 'not_started', provider: '(none)', type: 'request', cat: 'plumbing', fRole: 'worker' },
      // Stage 8
      { stage: 8, title: 'Ductwork Installation', budget: 600000, status: 'not_started', provider: '(none)', type: 'request', cat: 'other', fRole: 'worker' },
      { stage: 8, title: 'Equipment Installation', budget: 800000, status: 'not_started', provider: '(none)', type: 'request', cat: 'electrical', fRole: 'worker' },
      // Stage 9
      { stage: 9, title: 'Drywall Installation', budget: 500000, status: 'pending', provider: '(none)', type: 'request', cat: 'carpentry', fRole: 'worker' },
      { stage: 9, title: 'Painting', budget: 400000, status: 'not_started', provider: '(none)', type: 'request', cat: 'painting', fRole: 'worker' },
      { stage: 9, title: 'Flooring', budget: 450000, status: 'not_started', provider: '(none)', type: 'request', cat: 'other', fRole: 'worker' },
      // Stage 10
      { stage: 10, title: 'Lighting Fixture Installation', budget: 250000, status: 'pending', provider: '(none)', type: 'request', cat: 'electrical', fRole: 'worker' },
      { stage: 10, title: 'Plumbing Fixture Installation', budget: 200000, status: 'not_started', provider: '(none)', type: 'request', cat: 'plumbing', fRole: 'worker' },
      { stage: 10, title: 'Final Cleanup', budget: 100000, status: 'not_started', provider: '(none)', type: 'request', cat: 'general-labor', fRole: 'worker' }
    ];

    let tCount = 0;
    for (const t of rawTasks) {
      const pid = await getProvider(t.provider, t.fRole);
      const stageId = stageMap[t.stage] || null;

      if (t.type === 'request') {
        let reqStatus = 'open';
        if (t.status === 'completed') reqStatus = 'completed';
        if (t.status === 'in_progress') reqStatus = 'in-progress';
        
        await Request.create({
          title: t.title,
          description: `Execution of ${t.title} for the project`,
          category: t.cat,
          budget: t.budget,
          duration: 'one-to-four-weeks',
          clientId: client._id,
          projectId: project._id,
          stageId,
          status: reqStatus,
          hiredProviderId: (reqStatus === 'completed' || reqStatus === 'in-progress') ? pid?._id : null
        });
      } else {
        // Offer
        let offStatus = 'pending';
        if (t.status === 'completed') offStatus = 'completed';
        if (t.status === 'in_progress') offStatus = 'accepted';

        await JobOffer.create({
          title: t.title,
          description: `Direct hire for ${t.title}`,
          category: t.cat,
          offeredBudget: t.budget,
          duration: 'one-to-four-weeks',
          clientId: client._id,
          providerId: pid ? pid._id : client._id, // JobOffer strictly requires a providerId, fallback to client if none (though this shouldn't happen for the data given)
          projectId: project._id,
          stageId,
          status: offStatus
        });
      }
      tCount++;
    }
    console.log(`Created ${tCount} tasks.`);

    // 6. Documents
    const docs = ['Approved Building Permit.pdf', 'Architectural Drawings.pdf', 'Structural Calculations.pdf', 'Environmental Clearance Certificate.pdf'];
    for (const d of docs) {
      await Document.create({
        projectId: project._id,
        uploadedBy: client._id,
        fileName: d,
        filePath: '/uploads/dummy.pdf', // Dummy path
        fileSize: 1024 * 1024 * 2, // 2MB
        fileType: 'application/pdf',
        description: 'Project essential document'
      });
    }
    console.log('Created documents.');

    // 7. Compliance Types & Items
    const cTypes = [
      { name: 'Permit', icon: '📜' },
      { name: 'Certificate', icon: '🎖️' }
    ];
    const typeMap = {};
    for (const ct of cTypes) {
      let t = await ComplianceType.findOne({ name: ct.name });
      if (!t) t = await ComplianceType.create(ct);
      typeMap[ct.name] = t._id;
    }

    const compliances = [
      { tName: 'Permit', title: 'Building Permit', auth: 'Kochi Municipal Corporation', status: 'approved', exp: '2028-01-15' },
      { tName: 'Certificate', title: 'Fire Safety Certificate', auth: 'Fire & Rescue Department', status: 'not_started', exp: null }, // User specified 'pending', mapped to not_started or in_progress. I will use in_progress for pending. Wait, complianceItem schema enum: ['not_started', 'in_progress', 'submitted', 'approved', 'rejected', 'expired']
      { tName: 'Permit', title: 'Environmental Clearance', auth: 'Kerala Pollution Control Board', status: 'submitted', exp: '2027-02-01' }
    ];

    for (const c of compliances) {
      await ComplianceItem.create({
        projectId: project._id,
        type: typeMap[c.tName],
        title: c.title,
        authority: c.auth,
        status: (c.status === 'pending' || c.status === 'not_started') ? 'not_started' : (c.status === 'submitted' ? 'submitted' : 'approved'),
        expiryDate: c.exp ? new Date(c.exp) : null,
        createdBy: client._id
      });
    }
    console.log('Created compliance items.');

    console.log('--- ALL DONE --- \nDemo Project is ready!');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
