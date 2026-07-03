import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import requestRoutes from './routes/requests.js';
import chatRoutes from './routes/chat.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import jobOfferRoutes from './routes/jobOffers.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import projectRoutes from './routes/projects.js';
import availabilityRoutes from './routes/availability.js';
import jobRoutes from './routes/jobs.js';
import activityRoutes from './routes/activityRoutes.js';
import documentRoutes from './routes/documents.js';
import complianceRoutes from './routes/complianceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import stageRoutes from './routes/stageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import cron from 'node-cron';
import { checkExpiringCompliance } from './services/expiryChecker.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { socketHandler } from './services/socketService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/job-offers', jobOfferRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Socket.io connection
socketHandler(io);

// Daily cron job: check for expiring compliance items at 08:00
cron.schedule('0 8 * * *', () => {
  console.log('[Cron] Running compliance expiry check...');
  checkExpiringCompliance();
});

// Error handling
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { app, io };
