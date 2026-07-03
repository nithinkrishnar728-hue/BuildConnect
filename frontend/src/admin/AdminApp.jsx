import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAdminAuthStore } from './store/adminAuthStore';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

// Basic wrapper to protect admin routes
const AdminProtectedRoute = ({ children }) => {
    const { admin, loading } = useAdminAuthStore();
    
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    if (!admin) return <Navigate to="/admin/login" replace />;
    
    return children;
};

export default function AdminApp() {
    const { checkAuth } = useAdminAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <div className="font-sans">
            <Toaster position="top-right" />
            <Routes>
                <Route path="/login" element={<AdminLogin />} />
                <Route 
                    path="/*" 
                    element={
                        <AdminProtectedRoute>
                            <AdminDashboard />
                        </AdminProtectedRoute>
                    } 
                />
            </Routes>
        </div>
    );
}
