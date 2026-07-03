# Service Marketplace Platform

A complete, production-ready service marketplace platform with all 6 features fully integrated.

## 📋 Features

### 1. **Authentication & Authorization**
   - User signup with role selection (Client, Engineer, Worker)
   - Secure login with JWT tokens
   - Role-based access control
   - Auto-verify for demo purposes

### 2. **Role-Based Profiles**
   - Client profiles for hiring services
   - Engineer/Worker profiles with expertise and hourly rates
   - Profile completion with bio, skills, location, ratings
   - Public profile viewing with review history

### 3. **Provider Discovery**
   - Browse all service providers
   - Filter by role, expertise, city, minimum rating
   - Search functionality
   - View detailed provider profiles with reviews

### 4. **Request Workflow**
   - Create service requests with title, description, budget, duration
   - Browse open requests with filtering and search
   - Apply for requests with proposed price and cover letter
   - Accept/reject applications
   - Mark requests as complete
   - View applications with applicant details

### 5. **Real-Time Chat**
   - Socket.io powered real-time messaging
   - Create conversations with other users
   - Message history persistence
   - Typing indicators
   - Online/offline status tracking
   - 1-to-1 conversations linked to requests

### 6. **Reviews & Ratings**
   - Leave reviews after completing requests
   - 1-5 star rating system
   - Detailed rating criteria (communication, delivery time, quality)
   - Calculate average ratings and review counts
   - View all reviews on user profiles
   - Edit and delete own reviews

## 📦 Additional Features

- **Notifications System**: Real-time notifications for applications, messages, reviews, payments
- **Dashboard**: View statistics and recent activity
- **Request Management**: Track requests as client or provider
- **Payment Tracking**: Release payments upon completion
- **Search & Filtering**: Comprehensive search across requests and providers

## 🛠️ Prerequisites

- Node.js >= 14.x
- MongoDB >= 4.4
- npm or yarn

## 🚀 Installation

### Backend Setup

1. Clone/Extract the project:
    git clone <repository>
    cd service-marketplace

2. Install dependencies:
    npm install

3. Create .env file:
    cp .env.example .env
    
   Edit .env with your configuration:
    MONGODB_URI=mongodb://localhost:27017/service-marketplace
    JWT_SECRET=your_secret_key_here
    PORT=5000
    NODE_ENV=development
    CLIENT_URL=http://localhost:3000

4. Start MongoDB:
    mongod

5. Seed the database (creates test users and data):
    npm run seed

6. Start the backend server:
    npm run dev

   Server runs on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
    cd frontend

2. Install dependencies:
    npm install

3. Create .env file:
    cp .env.example .env
    
   Edit .env:
    VITE_API_URL=http://localhost:5000/api
    VITE_SOCKET_URL=http://localhost:5000

4. Start the development server:
    npm run dev

   Frontend runs on http://localhost:3000

## 🔐 Test Credentials

After seeding, use these credentials:

    Email: client@example.com
    Password: password123
    Role: Client

    Email: engineer@example.com
    Password: password123
    Role: Engineer

    Email: worker@example.com
    Password: password123
    Role: Worker

    Email: designer@example.com
    Password: password123
    Role: Engineer

    Email: writer@example.com
    Password: password123
    Role: Worker

    Email: marketing@example.com
    Password: password123
    Role: Worker

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users with filters
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile/update` - Update profile (protected)
- `GET /api/users/stats/:id` - Get user statistics

### Requests
- `GET /api/requests` - Get all requests with filtering
- `POST /api/requests` - Create request (protected)
- `GET /api/requests/:id` - Get request details
- `POST /api/requests/:id/apply` - Apply for request (protected)
- `POST /api/requests/:id/accept-application/:index` - Accept application (protected)
- `POST /api/requests/:id/complete` - Complete request (protected)
- `GET /api/requests/my/requests` - Get user's requests (protected)

### Chat
- `POST /api/chat/conversations` - Get or create conversation (protected)
- `GET /api/chat/conversations` - Get all conversations (protected)
- `GET /api/chat/conversations/:id` - Get conversation with messages (protected)
- `POST /api/chat/conversations/:id/messages` - Send message (protected)

### Reviews
- `POST /api/reviews` - Create review (protected)
- `GET /api/reviews/user/:userId` - Get user reviews
- `GET /api/reviews/request/:requestId` - Get request reviews
- `PUT /api/reviews/:id` - Update review (protected)
- `DELETE /api/reviews/:id` - Delete review (protected)

### Notifications
- `GET /api/notifications` - Get notifications (protected)
- `PUT /api/notifications/:id/read` - Mark as read (protected)
- `PUT /api/notifications/mark-all/read` - Mark all as read (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)
- `DELETE /api/notifications` - Delete all notifications (protected)

## 🗄️ Database Models

### User
- Personal info (firstName, lastName, email, phone)
- Authentication (password hashed with bcrypt)
- Role (client, engineer, worker, admin)
- Profile data (bio, expertise, hourlyRate, city, country)
- Rating metrics (rating, reviewCount, completedRequests)
- Verification status

### Request
- Title, description, category, budget, duration
- Skills required, experience level
- Client reference
- Status (open, in-progress, completed, cancelled)
- Applications array with provider proposals
- Payment status, views count

### Chat/Conversation
- Participant IDs
- Messages array (content, sender, timestamp, read status)
- Last message info for quick display
- Request reference (optional)
- Active status

### Review
- From user, to user, request reference
- Rating (1-5 stars)
- Title, comment
- Category ratings (communication, delivery, quality)
- Recommendation flag
- Prevents duplicate reviews with unique index

### Notification
- User recipient
- Type (request, application, message, review, payment, system)
- Title, message, related ID
- Read status
- Action URL for navigation

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - Token expiration time (default: 7d)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration (optional)

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

## 📁 Project Structure

### Backend
    server.js                 # Main server entry point
    models/                   # Database models (User, Request, Chat, Review, Notification)
    routes/                   # API routes
    middleware/               # Auth, validation, error handling
    services/                 # Socket.io service
    scripts/                  # Database seeding script
    package.json              # Dependencies

### Frontend
    src/
    ├── pages/                # Page components
    ├── components/           # Reusable components
    ├── store/                # Zustand state management
    ├── App.jsx               # Main app component
    ├── main.jsx              # Entry point
    └── index.css             # Global styles
    vite.config.js            # Vite configuration
    tailwind.config.js        # Tailwind CSS configuration
    package.json              # Dependencies

## 🚢 Deployment

### Backend (Heroku, Railway, Render)

1. Create MongoDB Atlas account and get connection string
2. Update .env with production values
3. Deploy with your chosen platform
4. Set environment variables on platform

### Frontend (Vercel, Netlify)

1. Update VITE_API_URL to production backend URL
2. Deploy from GitHub or upload build folder
3. Configure environment variables on platform

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally: `mongod`
- Check MongoDB URI in .env
- Verify MongoDB is accessible

### Socket.io Connection Error
- Check that backend server is running
- Verify VITE_SOCKET_URL matches backend URL
- Check browser console for errors

### CORS Errors
- Ensure CLIENT_URL matches frontend URL
- Backend and frontend should be on different ports
- Check axios interceptor configuration

### Port Already in Use
- Change PORT in .env for backend (default 5000)
- Change vite port in vite.config.js for frontend (default 3000)

### Authentication Issues
- Clear browser cookies and local storage
- Re-login with valid credentials
- Check JWT_SECRET in .env
- Verify token is sent in Authorization header

## 📝 Usage Examples

### Creating a Request (Client)

1. Login as a client
2. Click "Post Request" button
3. Fill in title, description, budget, skills needed
4. Submit request
5. Providers can now view and apply

### Applying for a Request (Provider)

1. Login as engineer/worker
2. Go to "Browse Requests"
3. Click on a request
4. Click "Apply for this Request"
5. Enter proposed price and cover letter
6. Wait for client to accept/reject

### Sending Messages

1. Navigate to Chat section
2. Click on a conversation or start new one
3. Type message and hit Send
4. Messages appear in real-time for both users
5. See typing indicators in real-time

### Leaving a Review

1. Complete a request (status = completed)
2. Click on that request
3. Review option appears
4. Rate 1-5 stars and leave comment
5. Submit review
6. Provider's overall rating updates automatically

## 🎯 Next Steps

### To Extend the Platform:

- Add payment integration (Stripe/PayPal)
- Implement escrow system
- Add portfolio/portfolio items
- Implement dispute resolution
- Add advanced search with tags/categories
- Email notifications integration
- Video call integration
- File upload/download
- Invoice generation
- Withdrawal system for providers
- Admin dashboard

## 📞 Support

For issues or questions, check:
- Browser console for frontend errors
- Server logs for backend errors
- MongoDB connection status
- Environment variables configuration

## 📄 License

MIT License - feel free to use this project

---

**Happy coding! 🚀**

Now you have a complete, production-ready service marketplace with all 6 features implemented!
