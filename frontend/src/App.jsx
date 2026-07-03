import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import BrowseProvidersPage from './pages/BrowseProvidersPage';
import BrowseRequestsPage from './pages/BrowseRequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import CreateRequestPage from './pages/CreateRequestPage';
import MyRequestsPage from './pages/MyRequestsPage';
// Missing pages removed to fix Vite compile
import ProjectsPage from './pages/ProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import EditProjectPage from './pages/EditProjectPage';
import ProjectDashboard from './pages/ProjectDashboard';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SendOfferPage from './pages/SendOfferPage';
import OfferDetailPage from './pages/OfferDetailPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import ProviderSchedulePage from './pages/ProviderSchedulePage';
import ComplianceDetailPage from './pages/ComplianceDetailPage';
import ComplianceFormPage from './pages/ComplianceFormPage';
import MyCompliancePage from './pages/MyCompliancePage';
import MyAssignedProjectsPage from './pages/MyAssignedProjectsPage';
import AdminApp from './admin/AdminApp';

import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

function App() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      {user && !window.location.pathname.startsWith('/admin') && <Navbar />}
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />

        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/browse-providers" element={<ProtectedRoute><BrowseProvidersPage /></ProtectedRoute>} />
        {/* Projects (Client Only) */}
        <Route path="/projects" element={
          <ProtectedRoute allowedRoles={['client']}>
            <ProjectsPage />
          </ProtectedRoute>
        } />

        <Route path="/projects/new" element={
          <ProtectedRoute allowedRoles={['client']}>
            <CreateProjectPage />
          </ProtectedRoute>
        } />

        <Route path="/projects/:id/edit" element={
          <ProtectedRoute allowedRoles={['client']}>
            <EditProjectPage />
          </ProtectedRoute>
        } />

        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <ProjectDashboard />
          </ProtectedRoute>
        } />
        <Route path="/browse-requests" element={<ProtectedRoute><BrowseRequestsPage /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
        <Route path="/providers/:id" element={<ProtectedRoute><ProviderProfilePage /></ProtectedRoute>} />
        <Route path="/create-request" element={<ProtectedRoute><CreateRequestPage /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><MyRequestsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/send-offer/:providerId" element={<ProtectedRoute><SendOfferPage /></ProtectedRoute>} />
        <Route path="/offers/:id" element={<ProtectedRoute><OfferDetailPage /></ProtectedRoute>} />
        <Route path="/supervisor-dashboard" element={<ProtectedRoute><SupervisorDashboard /></ProtectedRoute>} />

        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={['worker', 'engineer', 'supervisor']}>
            <ProviderSchedulePage />
          </ProtectedRoute>
        } />

        <Route path="/my-offers" element={<Navigate to="/my-requests" />} />
        <Route path="/my-assigned-projects" element={
          <ProtectedRoute allowedRoles={['worker', 'engineer', 'supervisor']}>
            <MyAssignedProjectsPage />
          </ProtectedRoute>
        } />

        {/* Compliance routes */}
        <Route path="/compliance/:id" element={<ProtectedRoute><ComplianceDetailPage /></ProtectedRoute>} />
        <Route path="/compliance/:id/edit" element={<ProtectedRoute><ComplianceFormPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/compliance/new" element={<ProtectedRoute><ComplianceFormPage /></ProtectedRoute>} />
        <Route path="/my-compliance" element={<ProtectedRoute><MyCompliancePage /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
